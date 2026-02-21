"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "./users"
import type { Conversation, Message } from "@/types/database"

interface ConversationWithParties extends Conversation {
  buyer?: { id: string; display_name: string; company: string | null }
  seller?: { id: string; display_name: string; company: string | null }
}

export async function getConversations(): Promise<ConversationWithParties[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("conversations")
    .select("*, buyer:users!buyer_id(id, display_name, company), seller:users!seller_id(id, display_name, company)")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_time", { ascending: false, nullsFirst: false })

  return (data ?? []).map((c) => ({
    ...c,
    buyer: c.buyer as unknown as ConversationWithParties["buyer"],
    seller: c.seller as unknown as ConversationWithParties["seller"],
  }))
}

export async function getOrCreateConversation(
  productId: string | null,
  otherUserId: string
): Promise<Conversation | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()

  // Try to find existing conversation
  let query = supabase
    .from("conversations")
    .select("*")
    .or(
      `and(buyer_id.eq.${user.id},seller_id.eq.${otherUserId}),and(buyer_id.eq.${otherUserId},seller_id.eq.${user.id})`
    )

  if (productId) {
    query = query.eq("product_id", productId)
  }

  const { data: existing } = await query.maybeSingle()

  if (existing) return existing

  // Create new conversation
  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({
      product_id: productId,
      buyer_id: user.id,
      seller_id: otherUserId,
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to create conversation:", error)
    return null
  }

  return conversation
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
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

  const supabase = await createClient()

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
      last_message_time: new Date().toISOString(),
    })
    .eq("id", conversationId)

  return { success: true, message }
}
