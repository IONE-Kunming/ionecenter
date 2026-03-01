"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { User } from "@/types/database"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Generate a unique seller code in the format S### (e.g. S101, S204).
 * Retries until a unique code is found.
 */
export async function generateUniqueSellerCode(supabase: SupabaseClient): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const num = Math.floor(100 + Math.random() * 900) // 100–999
    const code = `S${num}`
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("user_code", code)
      .maybeSingle()
    if (!existing) return code
  }
  // Fallback: use timestamp-based 3-digit code
  const fallback = `S${(Date.now() % 900) + 100}`
  return fallback
}

/**
 * Generate a unique buyer code in the format B### (e.g. B250, B103).
 * Retries until a unique code is found.
 */
export async function generateUniqueBuyerCode(supabase: SupabaseClient): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const num = Math.floor(100 + Math.random() * 900) // 100–999
    const code = `B${num}`
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("user_code", code)
      .maybeSingle()
    if (!existing) return code
  }
  // Fallback: use timestamp-based 3-digit code
  const fallback = `B${(Date.now() % 900) + 100}`
  return fallback
}

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", userId)
    .single()

  return data
}

export async function ensureUserInSupabase(): Promise<User | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", userId)
    .single()

  if (existing) return existing

  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? ""
  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email
  const role = (clerkUser.publicMetadata?.role as string) || "buyer"

  const insertData: Record<string, unknown> = {
    clerk_id: userId,
    email,
    display_name: displayName,
    role,
  }

  if (role === "buyer") {
    insertData.user_code = await generateUniqueBuyerCode(supabase)
  }

  const { data, error } = await supabase
    .from("users")
    .upsert(insertData, { onConflict: "clerk_id" })
    .select()
    .single()

  if (error) {
    console.error("Failed to sync user to Supabase:", error)
    return null
  }

  return data
}

export async function updateUserProfile(
  updates: Partial<Pick<User, "display_name" | "company" | "phone_number" | "preferred_language" | "street" | "city" | "state" | "zip" | "country" | "bank_name" | "account_name" | "account_number" | "swift_code" | "bank_branch" | "bank_region" | "bank_code" | "branch_code" | "bank_address" | "currency" | "payment_notes">>
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function getSellers(): Promise<User[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("role", "seller")
    .eq("is_active", true)
    .order("display_name")

  return data ?? []
}

/**
 * Ensure the current seller has a unique user_code.
 * If the seller has no code yet, generate one in the format S### and persist it.
 * Returns the (possibly freshly-generated) user_code.
 */
export async function ensureSellerCode(user: User): Promise<string | null> {
  if (user.user_code) return user.user_code

  const supabase = createAdminClient()
  const code = await generateUniqueSellerCode(supabase)
  const { error } = await supabase
    .from("users")
    .update({ user_code: code })
    .eq("id", user.id)

  if (error) {
    console.error("Failed to generate seller code:", error)
    return null
  }
  return code
}
