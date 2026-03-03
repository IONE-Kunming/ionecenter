"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Receipt, Search, Plus, Eye, Printer, Trash2, Pencil } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { useFormatters } from "@/lib/use-formatters"
import { useToast } from "@/components/ui/toaster"
import { deleteOfflineInvoice } from "@/lib/actions/invoices"
import Link from "@/components/ui/link"
import type { InvoiceStatus } from "@/types/database"

interface OrderInvoiceRow {
  id: string
  invoice_number: string
  total: number
  deposit_paid: number
  remaining_balance: number
  status: InvoiceStatus
  due_date: string
  created_at: string
  buyer_name: string
  buyer_email: string
}

interface BuyerInvoiceRow {
  id: string
  invoice_number: string
  total: number
  status: string
  created_at: string
  buyer_name: string
  buyer_email: string
}

export function SellerInvoicesList({
  orderInvoices,
  buyerInvoices,
}: {
  orderInvoices: OrderInvoiceRow[]
  buyerInvoices: BuyerInvoiceRow[]
}) {
  const t = useTranslations("invoices")
  const tCommon = useTranslations("common")
  const { formatCurrency, formatDate } = useFormatters()
  const { addToast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState("")

  const filteredOrder = orderInvoices.filter(
    (inv) =>
      !search ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.buyer_name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredBuyer = buyerInvoices.filter(
    (inv) =>
      !search ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.buyer_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (invoiceId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteOfflineInvoice(invoiceId)
        if (result.error) {
          addToast("error", result.error)
        } else {
          addToast("success", "Invoice deleted successfully")
          router.refresh()
        }
      } catch {
        addToast("error", "Failed to delete invoice")
      }
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tCommon("searchInvoices")} className="pl-9" />
        </div>
        <Link href="/seller/invoices/create">
          <Button><Plus className="h-4 w-4 mr-2" /> {t("createInvoice")}</Button>
        </Link>
      </div>

      {/* Section 1: Order Invoices */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("orderInvoices")}</h2>
        {filteredOrder.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("invoiceNumber")}</TableHead>
                  <TableHead>{tCommon("date")}</TableHead>
                  <TableHead>{t("buyer")}</TableHead>
                  <TableHead>{t("buyerEmail")}</TableHead>
                  <TableHead>{tCommon("total")}</TableHead>
                  <TableHead>{tCommon("status")}</TableHead>
                  <TableHead>{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrder.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>{formatDate(inv.created_at)}</TableCell>
                    <TableCell>{inv.buyer_name}</TableCell>
                    <TableCell>{inv.buyer_email}</TableCell>
                    <TableCell>{formatCurrency(inv.total)}</TableCell>
                    <TableCell><InvoiceStatusBadge status={inv.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/seller/invoices/${inv.id}`}>
                          <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        <Link href={`/seller/invoices/${inv.id}?print=true`}>
                          <Button variant="ghost" size="sm" aria-label="Print invoice"><Printer className="h-4 w-4" /></Button>
                        </Link>
                      </div>
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

      {/* Section 2: Buyer Invoices (offline) */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("buyerInvoices")}</h2>
        {filteredBuyer.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("invoiceNumber")}</TableHead>
                  <TableHead>{tCommon("date")}</TableHead>
                  <TableHead>{t("buyer")}</TableHead>
                  <TableHead>{t("buyerEmail")}</TableHead>
                  <TableHead>{tCommon("total")}</TableHead>
                  <TableHead>{tCommon("status")}</TableHead>
                  <TableHead>{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuyer.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>{formatDate(inv.created_at)}</TableCell>
                    <TableCell>{inv.buyer_name}</TableCell>
                    <TableCell>{inv.buyer_email}</TableCell>
                    <TableCell>{formatCurrency(inv.total)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${inv.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {inv.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/seller/invoices/offline/${inv.id}`}>
                          <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        <Link href={`/seller/invoices/create?edit=${inv.id}`}>
                          <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
                        </Link>
                        <Link href={`/seller/invoices/offline/${inv.id}?print=true`}>
                          <Button variant="ghost" size="sm"><Printer className="h-4 w-4" /></Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleDelete(inv.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
    </div>
  )
}
