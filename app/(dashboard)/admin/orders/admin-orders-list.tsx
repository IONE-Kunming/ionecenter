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

interface OrderRow {
  id: string
  status: OrderStatus
  payment_status: PaymentStatus
  total: number
  created_at: string
  buyer_name: string
  seller_name: string
}

export function AdminOrdersList({ orders }: { orders: OrderRow[] }) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const filtered = orders.filter((o) => {
    const matchSearch = !search || o.id.includes(search) || o.buyer_name.toLowerCase().includes(search.toLowerCase()) || o.seller_name.toLowerCase().includes(search.toLowerCase())
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
                <TableHead>Buyer</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-primary hover:underline">
                      {order.id.slice(0, 8)}...
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>{order.buyer_name}</TableCell>
                  <TableCell>{order.seller_name}</TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                  <TableCell><PaymentStatusBadge status={order.payment_status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState icon={FileText} title="No orders found" description="No orders match your search." />
      )}
    </div>
  )
}
