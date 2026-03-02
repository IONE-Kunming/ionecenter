"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"
import type { Notification } from "@/types/database"

export async function getNotifications(): Promise<Notification[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return data ?? []
}

export async function markNotificationRead(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function markAllNotificationsRead() {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false)

  if (error) return { error: error.message }
  return { success: true }
}
