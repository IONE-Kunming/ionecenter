"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"
import type { Conversation, Message } from "@/types/database"

interface ConversationWithParties extends Conversation {
  buyer?: { id: string; display_name: string; company: string | null }
  seller?: { id: string; display_name: string; company: string | null }
}

export async function getConversations(): Promise<ConversationWithParties[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("conversations")
    .select("*, buyer:users!buyer_id(id, display_name, company), seller:users!seller_id(id, display_name, company)")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })

  const conversations = (data ?? []).map((c) => ({
    ...c,
    buyer: c.buyer as unknown as ConversationWithParties["buyer"],
    seller: c.seller as unknown as ConversationWithParties["seller"],
  }))

  // Deduplicate: keep only one conversation per unique buyer-seller pair (the most recent one).
  // Normalize the pair key so (A,B) and (B,A) are treated as the same pair.
  const seen = new Set<string>()
  return conversations.filter((c) => {
    const pairKey = [c.buyer_id, c.seller_id].sort().join("|")
    if (seen.has(pairKey)) return false
    seen.add(pairKey)
    return true
  })
}

export async function getOrCreateConversation(
  otherUserId: string
): Promise<Conversation | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createAdminClient()

  // Find any existing conversation between these two users regardless of listing_id or who started it
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .or(
      `and(buyer_id.eq.${user.id},seller_id.eq.${otherUserId}),and(buyer_id.eq.${otherUserId},seller_id.eq.${user.id})`
    )
    .order("last_message_at", { ascending: false, nullsFirst: true })
    .limit(1)

  if (existing && existing.length > 0) return existing[0]

  // Create new conversation
  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({
      buyer_id: user.id,
      seller_id: otherUserId,
    })
    .select()
    .single()

  if (error) {
    // Handle race condition: if a concurrent request already created the conversation
    // (unique constraint violation code 23505), retry the lookup instead of failing.
    if (error.code === "23505") {
      const { data: retry } = await supabase
        .from("conversations")
        .select("*")
        .or(
          `and(buyer_id.eq.${user.id},seller_id.eq.${otherUserId}),and(buyer_id.eq.${otherUserId},seller_id.eq.${user.id})`
        )
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(1)
      if (retry && retry.length > 0) return retry[0]
    }
    console.error("Failed to create conversation:", error)
    return null
  }

  return conversation
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  return data ?? []
}

export async function sendMessage(conversationId: string, text: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  if (!text.trim()) return { error: "Message cannot be empty" }

  const supabase = createAdminClient()

  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      text: text.trim(),
      type: "text",
    })
    .select()
    .single()

  if (msgError) return { error: msgError.message }

  // Update conversation last_message
  await supabase
    .from("conversations")
    .update({
      last_message: text.trim(),
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId)

  return { success: true, message }
}

export async function sendAttachment(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const file = formData.get("file") as File
  const conversationId = formData.get("conversationId") as string

  if (!file || !conversationId) return { error: "Missing file or conversation" }

  // Validate file type
  const isImage = file.type.startsWith("image/")
  const isPdf = file.type === "application/pdf"
  if (!isImage && !isPdf) return { error: "Only images and PDFs are allowed" }

  const supabase = createAdminClient()

  // Upload file to storage
  const path = `${conversationId}/${Date.now()}-${file.name}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("chat-attachments")
    .upload(path, file)

  if (uploadError) return { error: uploadError.message }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("chat-attachments")
    .getPublicUrl(uploadData.path)

  // Determine message type
  const type = isImage ? "image" : "pdf"

  // Insert message
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      text: null,
      type,
      file_url: urlData.publicUrl,
      file_name: file.name,
    })
    .select()
    .single()

  if (msgError) return { error: msgError.message }

  // Update conversation last_message
  await supabase
    .from("conversations")
    .update({
      last_message: type === "image" ? "📷 Image" : "📄 PDF",
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId)

  return { success: true, message }
}
