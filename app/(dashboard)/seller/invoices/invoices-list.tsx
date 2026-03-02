"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Receipt, Search, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { useFormatters } from "@/lib/use-formatters"
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
  const t = useTranslations("invoices")
  const tCommon = useTranslations("common")
  const { formatCurrency, formatDate } = useFormatters()
  const [search, setSearch] = useState("")
  const filtered = invoices.filter((inv) => !search || inv.invoice_number.includes(search) || inv.buyer_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tCommon("searchInvoices")} className="pl-9" />
        </div>
        <Link href="/seller/invoices/create">
          <Button><Plus className="h-4 w-4 mr-2" /> {t("createInvoice")}</Button>
        </Link>
      </div>
      {filtered.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoiceNumber")}</TableHead>
                <TableHead>{tCommon("date")}</TableHead>
                <TableHead>{t("buyer")}</TableHead>
                <TableHead>{tCommon("total")}</TableHead>
                <TableHead>{tCommon("paid")}</TableHead>
                <TableHead>{t("balance")}</TableHead>
                <TableHead>{t("dueDate")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
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
        <EmptyState icon={Receipt} title={t("noInvoices")} />
      )}
    </div>
  )
}
