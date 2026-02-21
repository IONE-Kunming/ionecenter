"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { OrderStatus, PaymentStatus } from "@/types/database"

const SELLER_STATUSES = [
  { value: "pending", label: "Under Review" }, { value: "processing", label: "Confirmed" },
  { value: "shipped", label: "Shipped" }, { value: "delivered", label: "Delivered" }, { value: "cancelled", label: "Cancelled" },
]

const demoOrders = [
  { id: "20000000-0001", buyer_name: "John Smith", buyer_company: "Smith Construction LLC", status: "processing" as OrderStatus, payment_status: "deposit_paid" as PaymentStatus, total: 275.00, created_at: "2025-01-15" },
  { id: "20000000-0003", buyer_name: "Sarah Johnson", buyer_company: "Johnson Building Co.", status: "pending" as OrderStatus, payment_status: "pending" as PaymentStatus, total: 1875.00, created_at: "2025-01-10" },
]

export default function SellerOrdersPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const filtered = demoOrders.filter((o) => {
    const matchSearch = !search || o.buyer_name.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search)
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
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholder="All Statuses" options={SELLER_STATUSES} className="w-full sm:w-48" />
      </div>

      {filtered.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell><Link href={`/seller/orders/${order.id}`} className="font-medium text-primary hover:underline">{order.id.slice(0, 13)}...</Link></TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>{order.buyer_name}</TableCell>
                  <TableCell className="text-muted-foreground">{order.buyer_company}</TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                  <TableCell><PaymentStatusBadge status={order.payment_status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState icon={FileText} title="No orders found" />
      )}
    </div>
  )
}
