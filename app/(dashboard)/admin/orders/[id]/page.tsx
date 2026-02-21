import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getOrder } from "@/lib/actions/orders"

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) notFound()

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Order {order.id.slice(0, 8)}...</h2>
          <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.payment_status} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Buyer</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">{order.buyer?.display_name ?? "Unknown"}</p>
            <p className="text-sm text-muted-foreground">{order.buyer?.company ?? ""}</p>
            <p className="text-sm text-muted-foreground">{order.buyer?.email ?? ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Seller</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">{order.seller?.display_name ?? "Unknown"}</p>
            <p className="text-sm text-muted-foreground">{order.seller?.company ?? ""}</p>
            <p className="text-sm text-muted-foreground">{order.seller?.email ?? ""}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.model_number ?? "—"}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(item.price)}</TableCell>
                  <TableCell>{formatCurrency(item.price * item.quantity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax ({order.tax_rate}%)</span><span>{formatCurrency(order.tax)}</span></div>
            <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Deposit Paid</span><span>{formatCurrency(order.deposit_amount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Remaining Balance</span><span>{formatCurrency(order.remaining_balance)}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
