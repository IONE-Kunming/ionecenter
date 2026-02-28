import { Badge } from "@/components/ui/badge"
import type { OrderStatus, PaymentStatus, InvoiceStatus } from "@/types/database"

const orderStatusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  pending: { label: "Pending", variant: "warning" },
  under_review: { label: "Under Review", variant: "default" },
  confirmed: { label: "Confirmed", variant: "default" },
  in_production: { label: "In Production", variant: "default" },
  out_of_production: { label: "Out of Production", variant: "default" },
  shipped: { label: "Shipped", variant: "default" },
  arrived_at_port: { label: "Arrived at Port", variant: "default" },
  delivered: { label: "Delivered", variant: "success" },
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  pending: { label: "Pending", variant: "warning" },
  deposit_paid: { label: "Deposit Paid", variant: "default" },
  paid: { label: "Paid", variant: "success" },
}

const invoiceStatusConfig: Record<InvoiceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  issued: { label: "Issued", variant: "default" },
  paid: { label: "Paid", variant: "success" },
  overdue: { label: "Overdue", variant: "warning" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = orderStatusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = paymentStatusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const config = invoiceStatusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
