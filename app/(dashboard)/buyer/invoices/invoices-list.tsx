"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Receipt, Search, Download } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { InvoiceStatus } from "@/types/database"

interface InvoiceRow {
  id: string
  invoice_number: string
  total: number
  deposit_paid: number
  remaining_balance: number
  status: InvoiceStatus
  due_date: string
  created_at: string
  seller_name: string
}

export function BuyerInvoicesList({ invoices }: { invoices: InvoiceRow[] }) {
  const t = useTranslations("invoices")
  const tCommon = useTranslations("common")
  const [search, setSearch] = useState("")

  const filtered = invoices.filter((inv) =>
    !search || inv.invoice_number.toLowerCase().includes(search.toLowerCase()) || inv.seller_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tCommon("searchInvoices")} className="pl-9" />
      </div>

      {filtered.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoiceNumber")}</TableHead>
                <TableHead>{tCommon("date")}</TableHead>
                <TableHead>{t("seller")}</TableHead>
                <TableHead>{tCommon("total")}</TableHead>
                <TableHead>{tCommon("paid")}</TableHead>
                <TableHead>{t("balance")}</TableHead>
                <TableHead>{t("dueDate")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                  <TableCell>{formatDate(inv.created_at)}</TableCell>
                  <TableCell>{inv.seller_name}</TableCell>
                  <TableCell>{formatCurrency(inv.total)}</TableCell>
                  <TableCell>{formatCurrency(inv.deposit_paid)}</TableCell>
                  <TableCell>{formatCurrency(inv.remaining_balance)}</TableCell>
                  <TableCell>{formatDate(inv.due_date)}</TableCell>
                  <TableCell><InvoiceStatusBadge status={inv.status} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                  </TableCell>
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
