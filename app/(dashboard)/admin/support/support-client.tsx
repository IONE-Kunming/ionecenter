"use client"

import { useState, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { Ticket } from "lucide-react"
import { updateTicketStatus } from "@/lib/actions/support"
import { formatDate } from "@/lib/utils"
import type { SupportTicket } from "@/types/database"

const statusVariant: Record<string, "default" | "success" | "warning" | "secondary"> = {
  open: "warning",
  in_progress: "default",
  resolved: "success",
  closed: "secondary",
}

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
]

interface AdminSupportClientProps {
  tickets: SupportTicket[]
}

export default function AdminSupportClient({ tickets: initialTickets }: AdminSupportClientProps) {
  const [tickets, setTickets] = useState(initialTickets)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleStatusChange(ticketId: string, newStatus: string) {
    if (!newStatus) return
    setUpdatingId(ticketId)
    startTransition(async () => {
      const result = await updateTicketStatus(ticketId, newStatus)
      if (result.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
        )
      }
      setUpdatingId(null)
    })
  }

  if (tickets.length === 0) {
    return <EmptyState icon={Ticket} title="No tickets" description="No support tickets have been submitted yet." />
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-lg font-semibold">All Support Tickets</h2>
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{ticket.subject}</p>
                  <Badge variant={statusVariant[ticket.status] ?? "secondary"} className="shrink-0">
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ticket.message}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {ticket.type && <span className="capitalize">{ticket.type}</span>}
                  <span>{formatDate(ticket.created_at)}</span>
                  <span>User: {ticket.user_id.slice(0, 8)}…</span>
                </div>
              </div>
              <div className="shrink-0 w-36">
                <Select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                  disabled={pending && updatingId === ticket.id}
                  options={statusOptions}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
