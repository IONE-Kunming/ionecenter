"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Link from "@/components/ui/link"
import { FileText, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status-badge"
import { useFormatters } from "@/lib/use-formatters"
import type { OrderStatus, PaymentStatus } from "@/types/database"

interface OrderRow {
  id: string
  status: OrderStatus
  payment_status: PaymentStatus
  total: number
  deposit_amount: number
  created_at: string
  seller_name: string
}

export function BuyerOrdersList({ orders }: { orders: OrderRow[] }) {
  const t = useTranslations("orders")
  const tCommon = useTranslations("common")
  const { formatCurrency, formatDate } = useFormatters()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const filtered = orders.filter((o) => {
    const matchSearch = !search || o.id.includes(search) || o.seller_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tCommon("searchOrders")} className="pl-9" />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholder={tCommon("allStatuses")} options={[
          { value: "pending", label: "Pending" }, { value: "under_review", label: "Under Review" }, { value: "confirmed", label: "Confirmed" },
          { value: "in_production", label: "In Production" }, { value: "out_of_production", label: "Out of Production" },
          { value: "shipped", label: "Shipped" }, { value: "arrived_at_port", label: "Arrived at Port" }, { value: "delivered", label: "Delivered" },
        ]} className="w-full sm:w-48" />
      </div>

      {filtered.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("orderId")}</TableHead>
                <TableHead>{tCommon("date")}</TableHead>
                <TableHead>{t("seller")}</TableHead>
                <TableHead>{tCommon("total")}</TableHead>
                <TableHead>{t("deposit")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead>{t("payment")}</TableHead>
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
        <EmptyState icon={FileText} title={t("noOrders")} description={t("noOrdersDesc")} />
      )}
    </div>
  )
}
