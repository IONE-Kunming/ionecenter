import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { OrderStatus, PaymentStatus } from "@/types/database"

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Demo data
  const order = {
    id,
    status: "processing" as OrderStatus,
    payment_status: "deposit_paid" as PaymentStatus,
    created_at: "2025-01-15",
    subtotal: 250.00,
    tax: 25.00,
    total: 275.00,
    deposit_amount: 82.50,
    deposit_percentage: 30,
    remaining_balance: 192.50,
    payment_method: "Bank Transfer",
    buyer_name: "John Smith",
    buyer_company: "Smith Construction LLC",
    seller_name: "Kunming Aluminum Co.",
    items: [
      { name: "Premium Window Profile", model_number: "WP-6063-T5", quantity: 20, price: 12.50, subtotal: 250.00 },
    ],
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/buyer/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Order #{id.slice(0, 8)}</h2>
          <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.payment_status} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Customer</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{order.buyer_name}</p>
            <p className="text-muted-foreground">{order.buyer_company}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Seller</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium">{order.seller_name}</p>
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
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.model_number}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm max-w-xs ml-auto">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax (10%)</span><span>{formatCurrency(order.tax)}</span></div>
          <div className="border-t pt-2 flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
          <div className="flex justify-between text-green-600"><span>Deposit ({order.deposit_percentage}%)</span><span>-{formatCurrency(order.deposit_amount)}</span></div>
          <div className="border-t pt-2 flex justify-between font-semibold"><span>Remaining Balance</span><span>{formatCurrency(order.remaining_balance)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Payment Method</span><span>{order.payment_method}</span></div>
        </CardContent>
      </Card>
    </div>
  )
}
