"use client"

import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import type { OrderStatus, PaymentStatus, InvoiceStatus } from "@/types/database"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning"

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations("orders")
  const tCommon = useTranslations("common")

  const config: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: tCommon("pending"), variant: "warning" },
    under_review: { label: t("underReview"), variant: "default" },
    confirmed: { label: t("confirmed"), variant: "default" },
    in_production: { label: t("inProduction"), variant: "default" },
    out_of_production: { label: t("outOfProduction"), variant: "default" },
    shipped: { label: tCommon("shipped"), variant: "default" },
    arrived_at_port: { label: t("arrivedAtPort"), variant: "default" },
    delivered: { label: tCommon("delivered"), variant: "success" },
  }

  const cfg = config[status]
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tCommon = useTranslations("common")
  const t = useTranslations("invoices")

  const config: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: tCommon("pending"), variant: "warning" },
    deposit_paid: { label: t("depositPaid"), variant: "default" },
    paid: { label: tCommon("paid"), variant: "success" },
  }

  const cfg = config[status]
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const tCommon = useTranslations("common")
  const t = useTranslations("invoices")

  const config: Record<InvoiceStatus, { label: string; variant: BadgeVariant }> = {
    issued: { label: t("issued"), variant: "default" },
    paid: { label: tCommon("paid"), variant: "success" },
    overdue: { label: tCommon("overdue"), variant: "warning" },
    cancelled: { label: tCommon("cancelled"), variant: "destructive" },
  }

  const cfg = config[status]
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
