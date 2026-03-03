import { notFound } from "next/navigation"
import Link from "@/components/ui/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status-badge"
import { formatCurrency, formatDate, getIntlLocale } from "@/lib/utils"
import { getOrder } from "@/lib/actions/orders"
import { getTranslations, getLocale } from "next-intl/server"

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) notFound()

  const [locale, t, tCommon] = await Promise.all([
    getLocale(),
    getTranslations("orders"),
    getTranslations("common"),
  ])
  const intlLocale = getIntlLocale(locale)

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("backToOrders")}
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Order {order.id.slice(0, 8)}...</h2>
          <p className="text-sm text-muted-foreground">{formatDate(order.created_at, intlLocale)}</p>
        </div>
        <div className="flex gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.payment_status} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("buyer")}</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">{order.buyer?.display_name ?? tCommon("unknown")}</p>
            <p className="text-sm text-muted-foreground">{order.buyer?.company ?? ""}</p>
            <p className="text-sm text-muted-foreground">{order.buyer?.email ?? ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("seller")}</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">{order.seller?.display_name ?? tCommon("unknown")}</p>
            <p className="text-sm text-muted-foreground">{order.seller?.company ?? ""}</p>
            <p className="text-sm text-muted-foreground">{order.seller?.email ?? ""}</p>
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
                <TableHead>{t("qty")}</TableHead>
                <TableHead>{t("price")}</TableHead>
                <TableHead>{t("subtotal")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.model_number ?? "—"}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(item.price, "USD", intlLocale)}</TableCell>
                  <TableCell>{formatCurrency(item.price * item.quantity, "USD", intlLocale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("paymentSummary")}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("subtotal")}</span><span>{formatCurrency(order.subtotal, "USD", intlLocale)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("taxPercent", { rate: order.tax_rate })}</span><span>{formatCurrency(order.tax, "USD", intlLocale)}</span></div>
            <div className="flex justify-between font-bold border-t pt-2"><span>{tCommon("total")}</span><span>{formatCurrency(order.total, "USD", intlLocale)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("depositPaid")}</span><span>{formatCurrency(order.deposit_amount, "USD", intlLocale)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("remainingBalance")}</span><span>{formatCurrency(order.remaining_balance, "USD", intlLocale)}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
