"use server"

import { Resend } from "resend"
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

  const recipientEmail = user.role === "seller" 
    ? "business@ionecenter.com" 
    : "contactus@ionecenter.com"

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

  // Send email notification via Resend
  const apiKey = process.env.RESEND_API_KEY
  if (apiKey) {
    try {
      const resend = new Resend(apiKey)
      const fromEmail = process.env.RESEND_FROM_EMAIL || "IONE Center <noreply@ionecenter.com>"
      const issueType = data.type
        ? data.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "General"
      const safeReplyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) ? user.email : undefined
      await resend.emails.send({
        from: fromEmail,
        to: [recipientEmail],
        replyTo: safeReplyTo,
        subject: `[Support Ticket] ${data.subject}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
            <div style="text-align:center;padding:20px 0;border-bottom:2px solid #e11d48;">
              <h1 style="color:#e11d48;margin:0;">IONE Center</h1>
            </div>
            <div style="padding:20px 0;">
              <h2 style="margin:0 0 8px;">New Support Ticket</h2>
              <p style="margin:0 0 4px;"><strong>From:</strong> ${escapeHtml(user.email)} (${escapeHtml(user.role)})</p>
              <p style="margin:0 0 4px;"><strong>Issue Type:</strong> ${escapeHtml(issueType)}</p>
              <p style="margin:0 0 4px;"><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
            </div>
            <div style="background:#f9fafb;padding:16px;border-radius:8px;">
              <p style="margin:0;white-space:pre-wrap;">${escapeHtml(data.message)}</p>
            </div>
            <p style="color:#888;font-size:12px;margin-top:20px;">
              Reply to this email to respond directly to the user.
            </p>
          </div>
        `,
      })
    } catch (err) {
      // Email failure should not block ticket creation
      console.error("[support] Failed to send ticket email:", err)
    }
  }

  return { success: true, recipientEmail }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

const VALID_TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"] as const

export async function updateTicketStatus(id: string, status: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  if (user.role !== "admin") return { error: "Not authorized" }

  if (!VALID_TICKET_STATUSES.includes(status as typeof VALID_TICKET_STATUSES[number])) {
    return { error: "Invalid ticket status" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("support_tickets")
    .update({ status })
    .eq("id", id)

  if (error) return { error: error.message }
  return { success: true }
}
