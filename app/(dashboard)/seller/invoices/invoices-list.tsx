"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Receipt, Search, Plus, Eye, Printer, Trash2, Pencil } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { useFormatters } from "@/lib/use-formatters"
import { useToast } from "@/components/ui/toaster"
import { deleteInvoice, deleteOfflineInvoice, getInvoice } from "@/lib/actions/invoices"
import Link from "@/components/ui/link"
import type { InvoiceStatus, Invoice } from "@/types/database"

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
  const tOrders = useTranslations("orders")
  const { formatCurrency, formatDate } = useFormatters()
  const { addToast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "order" | "buyer" } | null>(null)

  useEffect(() => {
    if (printInvoice) {
      // Short delay to ensure the hidden print div is rendered in the DOM before printing
      const timer = setTimeout(() => {
        window.print()
        setPrintInvoice(null)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [printInvoice])

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

  const handleDeleteOrderInvoice = (invoiceId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteInvoice(invoiceId)
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

  const handlePrint = (invoiceId: string) => {
    startTransition(async () => {
      try {
        const invoice = await getInvoice(invoiceId)
        if (!invoice || !invoice.items) {
          addToast("error", "Failed to fetch invoice data")
          return
        }
        setPrintInvoice(invoice)
      } catch {
        addToast("error", "Failed to fetch invoice data")
      }
    })
  }

  const hasBuyerBank = printInvoice && (
    printInvoice.buyer_bank_account_name ||
    printInvoice.buyer_bank_account_number ||
    printInvoice.buyer_bank_name
  )
  const hasSellerBank = printInvoice?.seller && (
    printInvoice.seller.account_name ||
    printInvoice.seller.account_number ||
    printInvoice.seller.bank_name
  )

  return (
    <>
    <div className={`space-y-8${printInvoice ? " print:hidden" : ""}`}>
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
                        <Link href={`/seller/invoices/${inv.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Button variant="ghost" size="sm" disabled={isPending} onClick={() => handlePrint(inv.id)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" disabled={isPending} onClick={() => setDeleteTarget({ id: inv.id, type: "order" })}>
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

      {/* Separator between sections */}
      <hr className="my-4 border-border" />

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
                          onClick={() => setDeleteTarget({ id: inv.id, type: "buyer" })}
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

    {/* Hidden print layout — visible only during print */}
    {printInvoice && (
      <div className="hidden print:block">
        <div className="space-y-6 invoice-print-area">
          {/* Page 1 — Header and Information */}
          <div className="invoice-detail-header invoice-print-header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="IONE Center" width={140} height={46} style={{ margin: "0 auto" }} />
          </div>

          <div className="invoice-detail-info-row invoice-info-row">
            <div>
              <p><strong>{t("invoiceNumber")}:</strong> {printInvoice.invoice_number}</p>
              <p><strong>{tCommon("date")}:</strong> {formatDate(printInvoice.created_at)}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p><strong>{t("supplier")}</strong></p>
              {printInvoice.seller?.display_name && <p>{printInvoice.seller.display_name}</p>}
            </div>
          </div>

          <div className="invoice-detail-section invoice-print-section">
            <h3 className="invoice-detail-section-title invoice-print-section-title">{t("buyerInformation")}</h3>
            <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
              <p><strong>{t("buyerCode")}:</strong> {printInvoice.buyer?.user_code || "—"}</p>
              <p><strong>{t("buyerName")}:</strong> {printInvoice.buyer?.display_name || printInvoice.buyer_name || "—"}</p>
              <p><strong>{t("buyerEmail")}:</strong> {printInvoice.buyer?.email || printInvoice.buyer_email || "—"}</p>
            </div>
          </div>

          <div className="invoice-detail-section invoice-print-section">
            <h3 className="invoice-detail-section-title invoice-print-section-title">{t("sellerInformation")}</h3>
            <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
              <p><strong>{t("sellerCode")}:</strong> {printInvoice.seller?.user_code || "—"}</p>
              <p><strong>{t("sellerName")}:</strong> {printInvoice.seller?.display_name || "—"}</p>
              <p><strong>{t("sellerEmail")}:</strong> {printInvoice.seller?.email || "—"}</p>
            </div>
          </div>

          {hasBuyerBank && (
            <div className="invoice-detail-section invoice-print-section">
              <h3 className="invoice-detail-section-title invoice-print-section-title">{t("buyerBankInformation")}</h3>
              <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
                {printInvoice.buyer_bank_account_name && <p><strong>{t("accountHolder")}:</strong> {printInvoice.buyer_bank_account_name}</p>}
                {printInvoice.buyer_bank_account_number && <p><strong>{t("accountNumber")}:</strong> {printInvoice.buyer_bank_account_number}</p>}
                {printInvoice.buyer_bank_swift_code && <p><strong>{t("swiftBicCode")}:</strong> {printInvoice.buyer_bank_swift_code}</p>}
                {printInvoice.buyer_bank_name && <p><strong>{t("bankName")}:</strong> {printInvoice.buyer_bank_name}</p>}
                {printInvoice.buyer_bank_region && <p><strong>{t("bankRegion")}:</strong> {printInvoice.buyer_bank_region}</p>}
                {printInvoice.buyer_bank_code && <p><strong>{t("bankCode")}:</strong> {printInvoice.buyer_bank_code}</p>}
                {printInvoice.buyer_bank_branch_code && <p><strong>{t("branchCode")}:</strong> {printInvoice.buyer_bank_branch_code}</p>}
                {printInvoice.buyer_bank_address && <p><strong>{t("bankAddress")}:</strong> {printInvoice.buyer_bank_address}</p>}
              </div>
            </div>
          )}

          {hasSellerBank && (
            <div className="invoice-detail-section invoice-print-section">
              <h3 className="invoice-detail-section-title invoice-print-section-title">{t("bankInformation")}</h3>
              <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
                {printInvoice.seller?.account_name && <p><strong>{t("accountHolder")}:</strong> {printInvoice.seller.account_name}</p>}
                {printInvoice.seller?.account_number && <p><strong>{t("accountNumber")}:</strong> {printInvoice.seller.account_number}</p>}
                {printInvoice.seller?.swift_code && <p><strong>{t("swiftBicCode")}:</strong> {printInvoice.seller.swift_code}</p>}
                {printInvoice.seller?.bank_name && <p><strong>{t("bankName")}:</strong> {printInvoice.seller.bank_name}</p>}
                {printInvoice.seller?.bank_region && <p><strong>{t("bankRegion")}:</strong> {printInvoice.seller.bank_region}</p>}
                {printInvoice.seller?.bank_code && <p><strong>{t("bankCode")}:</strong> {printInvoice.seller.bank_code}</p>}
                {printInvoice.seller?.branch_code && <p><strong>{t("branchCode")}:</strong> {printInvoice.seller.branch_code}</p>}
                {printInvoice.seller?.bank_address && <p><strong>{t("bankAddress")}:</strong> {printInvoice.seller.bank_address}</p>}
              </div>
            </div>
          )}

          {/* Page 2 — Invoice Content */}
          <div className="invoice-print-page-break">
            {printInvoice.items && printInvoice.items.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[260px]">{t("item")}</TableHead>
                        <TableHead>{t("description")}</TableHead>
                        <TableHead className="text-right w-[120px]">{t("unitPrice")}</TableHead>
                        <TableHead className="text-right w-[90px]">{t("qty")}</TableHead>
                        <TableHead className="text-right w-[120px]">{tCommon("total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {printInvoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <span className="text-sm font-mono">{item.name}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{item.description || "—"}</span>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <Card className="invoice-summary-card">
              <CardContent className="space-y-2 text-sm max-w-xs ml-auto pt-6">
                <div className="flex justify-between"><span>{tOrders("subtotal")}</span><span>{formatCurrency(printInvoice.subtotal)}</span></div>
                {printInvoice.discount > 0 && (
                  <div className="flex justify-between"><span>{t("discount")}</span><span>({formatCurrency(printInvoice.discount)})</span></div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold"><span>{tCommon("total")}</span><span>{formatCurrency(printInvoice.total)}</span></div>
                {printInvoice.deposit_paid > 0 && (
                  <div className="flex justify-between text-green-600"><span>{t("amountPaid")}</span><span>{formatCurrency(printInvoice.deposit_paid)}</span></div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold text-lg invoice-amount-due"><span>{t("amountDue")}</span><span>{formatCurrency(printInvoice.remaining_balance)}</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )}
    {/* Delete confirmation dialog */}
    <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteInvoice")}</DialogTitle>
          <DialogDescription>
            {t("deleteInvoiceConfirm")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            {tCommon("cancel")}
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              if (!deleteTarget) return
              if (deleteTarget.type === "order") {
                handleDeleteOrderInvoice(deleteTarget.id)
              } else {
                handleDelete(deleteTarget.id)
              }
              setDeleteTarget(null)
            }}
          >
            {tCommon("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

