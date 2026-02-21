"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { OrderStatus, PaymentStatus } from "@/types/database"

const demoOrders = [
  { id: "20000000-0001", status: "processing" as OrderStatus, payment_status: "deposit_paid" as PaymentStatus, total: 275.00, deposit_amount: 82.50, created_at: "2025-01-15", seller_name: "Kunming Aluminum Co." },
  { id: "20000000-0002", status: "delivered" as OrderStatus, payment_status: "paid" as PaymentStatus, total: 1430.00, deposit_amount: 1430.00, created_at: "2025-01-12", seller_name: "Gulf Aluminum Industries" },
  { id: "20000000-0003", status: "pending" as OrderStatus, payment_status: "pending" as PaymentStatus, total: 875.00, deposit_amount: 0, created_at: "2025-01-10", seller_name: "Kunming Aluminum Co." },
  { id: "20000000-0004", status: "shipped" as OrderStatus, payment_status: "deposit_paid" as PaymentStatus, total: 3200.00, deposit_amount: 960.00, created_at: "2025-01-08", seller_name: "Gulf Aluminum Industries" },
]

export default function BuyerOrdersPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const filtered = demoOrders.filter((o) => {
    const matchSearch = !search || o.id.includes(search) || o.seller_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="pl-9" />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholder="All Statuses" options={[
          { value: "draft", label: "Draft" }, { value: "pending", label: "Pending" }, { value: "processing", label: "Processing" },
          { value: "shipped", label: "Shipped" }, { value: "delivered", label: "Delivered" }, { value: "cancelled", label: "Cancelled" },
        ]} className="w-full sm:w-48" />
      </div>

      {filtered.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Deposit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/buyer/orders/${order.id}`} className="font-medium text-primary hover:underline">
                      {order.id.slice(0, 13)}...
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>{order.seller_name}</TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell>{formatCurrency(order.deposit_amount)}</TableCell>
                  <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                  <TableCell><PaymentStatusBadge status={order.payment_status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState icon={FileText} title="No orders found" description="You haven't placed any orders yet." />
      )}
    </div>
  )
}
