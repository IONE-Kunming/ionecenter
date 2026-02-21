"use server"

import { auth } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import type { User } from "@/types/database"

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

export async function updateUserProfile(
  updates: Partial<Pick<User, "display_name" | "company" | "phone_number" | "preferred_language" | "street" | "city" | "state" | "zip" | "country" | "bank_name" | "account_name" | "account_number" | "swift_code" | "bank_branch" | "currency" | "payment_notes">>
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
    .order("display_name")

  return data ?? []
}
