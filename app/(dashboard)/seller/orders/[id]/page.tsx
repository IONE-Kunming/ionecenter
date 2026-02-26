import { notFound } from "next/navigation"
import Link from "@/components/ui/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getOrder } from "@/lib/actions/orders"
import { StatusUpdate } from "./status-update"
import { getTranslations } from "next-intl/server"

export default async function SellerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) notFound()

  const t = await getTranslations("orders")
  const tCommon = await getTranslations("common")

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/seller/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("backToOrders")}
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{t("orderNumber", { id: order.id.slice(0, 8) })}</h2>
          <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.payment_status} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">{t("buyer")}</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{order.buyer?.display_name ?? tCommon("unknown")}</p>
            <p className="text-muted-foreground">{order.buyer?.company ?? ""}</p>
            <p className="text-muted-foreground">{order.buyer?.email ?? ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">{t("updateStatus")}</CardTitle></CardHeader>
          <CardContent>
            <StatusUpdate orderId={order.id} currentStatus={order.status} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("orderItems")}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("product")}</TableHead>
                <TableHead>{t("model")}</TableHead>
                <TableHead className="text-right">{t("qty")}</TableHead>
                <TableHead className="text-right">{t("price")}</TableHead>
                <TableHead className="text-right">{t("subtotal")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.model_number ?? "—"}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("paymentSummary")}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm max-w-xs ml-auto">
          <div className="flex justify-between"><span className="text-muted-foreground">{t("subtotal")}</span><span>{formatCurrency(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{t("taxPercent", { rate: order.tax_rate })}</span><span>{formatCurrency(order.tax)}</span></div>
          <div className="border-t pt-2 flex justify-between font-semibold"><span>{tCommon("total")}</span><span>{formatCurrency(order.total)}</span></div>
          <div className="flex justify-between text-green-600"><span>{t("depositPercent", { rate: order.deposit_percentage })}</span><span>-{formatCurrency(order.deposit_amount)}</span></div>
          <div className="border-t pt-2 flex justify-between font-semibold"><span>{t("remaining")}</span><span>{formatCurrency(order.remaining_balance)}</span></div>
        </CardContent>
      </Card>
    </div>
  )
}
