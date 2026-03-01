"use client"

import { useState } from "react"
import { Receipt, Search, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "@/components/ui/link"
import type { InvoiceStatus } from "@/types/database"

interface SellerInvoiceRow {
  id: string
  invoice_number: string
  total: number
  deposit_paid: number
  remaining_balance: number
  status: InvoiceStatus
  due_date: string
  created_at: string
  buyer_name: string
}

export function SellerInvoicesList({ invoices }: { invoices: SellerInvoiceRow[] }) {
  const [search, setSearch] = useState("")
  const filtered = invoices.filter((inv) => !search || inv.invoice_number.includes(search) || inv.buyer_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices..." className="pl-9" />
        </div>
        <Link href="/seller/invoices/create">
          <Button><Plus className="h-4 w-4 mr-2" /> Create Invoice</Button>
        </Link>
      </div>
      {filtered.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                  <TableCell>{formatDate(inv.created_at)}</TableCell>
                  <TableCell>{inv.buyer_name}</TableCell>
                  <TableCell>{formatCurrency(inv.total)}</TableCell>
                  <TableCell>{formatCurrency(inv.deposit_paid)}</TableCell>
                  <TableCell>{formatCurrency(inv.remaining_balance)}</TableCell>
                  <TableCell>{formatDate(inv.due_date)}</TableCell>
                  <TableCell><InvoiceStatusBadge status={inv.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState icon={Receipt} title="No invoices found" />
      )}
    </div>
  )
}
