"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { HelpCircle, Plus, Ticket } from "lucide-react"
import { createSupportTicket } from "@/lib/actions/support"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/components/ui/toaster"
import type { SupportTicket } from "@/types/database"

const statusVariant: Record<string, "default" | "success" | "warning" | "secondary"> = {
  open: "warning",
  in_progress: "default",
  resolved: "success",
  closed: "secondary",
}

interface SupportClientProps {
  tickets: SupportTicket[]
}

export default function SupportClient({ tickets: initialTickets }: SupportClientProps) {
  const [tickets, setTickets] = useState(initialTickets)
  const [showForm, setShowForm] = useState(false)
  const [pending, startTransition] = useTransition()
  const t = useTranslations("support")
  const tCommon = useTranslations("common")
  const { addToast } = useToast()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      type: formData.get("type") as string || undefined,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    }
    startTransition(async () => {
      const result = await createSupportTicket(data)
      if (result.success) {
        const newTicket: SupportTicket = {
          id: `temp-${Date.now()}`,
          user_id: "",
          type: data.type ?? null,
          subject: data.subject,
          message: data.message,
          status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setTickets((prev) => [newTicket, ...prev])
        setShowForm(false)
        form.reset()
        addToast("success", t("ticketSubmitted"))
      } else {
        addToast("error", result.error ?? t("submitError"))
      }
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("yourTickets")}</h2>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"} className="gap-2">
          <Plus className="h-4 w-4" /> {showForm ? tCommon("cancel") : t("newTicket")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5" /> {t("createTicket")}</CardTitle>
            <CardDescription>{t("createTicketDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">{t("issueType")}</Label>
                <Select id="type" name="type" options={[
                  { value: "order", label: t("orderIssue") },
                  { value: "payment", label: t("paymentIssue") },
                  { value: "product", label: t("productIssue") },
                  { value: "account", label: t("accountIssue") },
                  { value: "other", label: t("other") },
                ]} placeholder={t("selectIssueType")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">{t("subject")}</Label>
                <Input id="subject" name="subject" placeholder={t("subjectPlaceholder")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">{t("message")}</Label>
                <Textarea id="message" name="message" placeholder={t("messagePlaceholder")} rows={5} required />
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? t("submitting") : t("submitTicket")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tickets.length === 0 ? (
        <EmptyState icon={Ticket} title={t("noTickets")} description={t("noTicketsDesc")} />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ticket.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {ticket.type && <span className="capitalize">{ticket.type}</span>}
                    <span>{formatDate(ticket.created_at)}</span>
                  </div>
                </div>
                <Badge variant={statusVariant[ticket.status] ?? "secondary"} className="shrink-0">
                  {ticket.status.replace("_", " ")}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
