"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "./users"
import type { SupportTicket } from "@/types/database"

export async function getSupportTickets(): Promise<SupportTicket[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()

  // Admin sees all tickets, regular users see only their own
  let query = supabase
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false })

  if (user.role !== "admin") {
    query = query.eq("user_id", user.id)
  }

  const { data } = await query
  return data ?? []
}

export async function createSupportTicket(data: {
  type?: string
  subject: string
  message: string
}) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user.id,
      type: data.type ?? null,
      subject: data.subject,
      message: data.message,
      status: "open",
    })

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateTicketStatus(id: string, status: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  if (user.role !== "admin") return { error: "Not authorized" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("support_tickets")
    .update({ status })
    .eq("id", id)

  if (error) return { error: error.message }
  return { success: true }
}
