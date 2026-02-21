"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        clerk_id: userId,
        email,
        display_name: displayName,
        role,
      },
      { onConflict: "clerk_id" }
    )
    .select()
    .single()

  if (error) {
    console.error("Failed to sync user to Supabase:", error)
    return null
  }

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
