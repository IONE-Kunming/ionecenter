"use server"

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { UserRole } from "@/types/database"

export async function setUserRole(role: UserRole) {
  const { userId } = await auth()
  if (!userId) return { error: "Not authenticated" }

  if (role !== "buyer" && role !== "seller") {
    return { error: "Invalid role" }
  }

  try {
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    })

    const supabase = createAdminClient()
    const { error: dbError } = await supabase
      .from("users")
      .update({ role })
      .eq("clerk_id", userId)

    if (dbError) {
      console.error("Failed to update role in database:", dbError)
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to set user role:", error)
    return { error: "Failed to set role" }
  }
}

export async function getUserRole(): Promise<UserRole | null> {
  const { userId } = await auth()
  if (!userId) return null

  // Check Supabase first (admin-editable source of truth)
  const adminClient = createAdminClient()
  const { data: dbUser } = await adminClient
    .from("users")
    .select("role")
    .eq("clerk_id", userId)
    .single()

  if (dbUser?.role) return dbUser.role as UserRole

  // Fallback to Clerk metadata
  const user = await currentUser()
  if (!user) return null
  return (user.publicMetadata?.role as UserRole) || null
}
