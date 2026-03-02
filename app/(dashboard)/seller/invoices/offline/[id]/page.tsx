import { notFound } from "next/navigation"
import Link from "@/components/ui/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate, getIntlLocale } from "@/lib/utils"
import { getOfflineInvoice } from "@/lib/actions/invoices"
import { getTranslations, getLocale } from "next-intl/server"
import { PrintTrigger } from "./print-trigger"
import { PrintButton } from "./print-button"

export default async function OfflineInvoiceDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  const { id } = await params
  const { print } = await searchParams
  const invoice = await getOfflineInvoice(id)

  if (!invoice) notFound()

  const t = await getTranslations("invoices")
  const tOrders = await getTranslations("orders")
  const tCommon = await getTranslations("common")
  const locale = await getLocale()
  const intlLocale = getIntlLocale(locale)

  const hasBuyerBank = invoice.buyer_bank && (invoice.buyer_bank.account_name || invoice.buyer_bank.account_number || invoice.buyer_bank.bank_name)
  const hasSellerBank = invoice.seller && (invoice.seller.account_name || invoice.seller.account_number || invoice.seller.bank_name)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="print:hidden flex items-center justify-between">
        <Link href="/seller/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("backToInvoices")}
        </Link>
        <PrintButton label={t("printInvoice")} />
      </div>

      {print === "true" && <PrintTrigger />}

      <div className="space-y-6 invoice-print-area">
        {/* Logo centered at top */}
        <div className="invoice-detail-header invoice-print-header">
          <Image src="/logo.svg" alt="IONE Center" width={140} height={46} style={{ margin: "0 auto" }} />
        </div>

        {/* Invoice Number, Date, and Supplier on the same row */}
        <div className="invoice-detail-info-row invoice-info-row">
          <div>
            <p className="text-foreground"><strong>{t("invoiceNumber")}:</strong> {invoice.invoice_number}</p>
            <p className="text-foreground"><strong>{tCommon("date")}:</strong> {formatDate(invoice.created_at, intlLocale)}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="text-foreground"><strong>{t("supplier")}</strong></p>
            {invoice.seller?.display_name && <p className="text-foreground">{invoice.seller.display_name}</p>}
          </div>
        </div>

        {/* Buyer Information */}
        <div className="invoice-detail-section invoice-print-section">
          <h3 className="invoice-detail-section-title invoice-print-section-title text-foreground">{t("buyerInformation")}</h3>
          <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
            <p className="text-foreground"><strong>{t("buyerCode")}:</strong> {invoice.buyer_code || "—"}</p>
            <p className="text-foreground"><strong>{t("buyerName")}:</strong> {invoice.buyer_name || "—"}</p>
            <p className="text-foreground"><strong>{t("buyerEmail")}:</strong> {invoice.buyer_email || "—"}</p>
          </div>
        </div>

        {/* Supplier Information */}
        <div className="invoice-detail-section invoice-print-section">
          <h3 className="invoice-detail-section-title invoice-print-section-title text-foreground">{t("sellerInformation")}</h3>
          <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
            <p className="text-foreground"><strong>{t("sellerCode")}:</strong> {invoice.seller?.user_code || "—"}</p>
            <p className="text-foreground"><strong>{t("sellerName")}:</strong> {invoice.seller?.display_name || "—"}</p>
            <p className="text-foreground"><strong>{t("sellerEmail")}:</strong> {invoice.seller?.email || "—"}</p>
          </div>
        </div>

        {/* Bank Information — from seller profile */}
        {hasSellerBank && (
          <div className="invoice-detail-section invoice-print-section">
            <h3 className="invoice-detail-section-title invoice-print-section-title text-foreground">{t("bankInformation")}</h3>
            <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
              {invoice.seller!.account_name && <p className="text-foreground"><strong>{t("accountHolder")}:</strong> {invoice.seller!.account_name}</p>}
              {invoice.seller!.account_number && <p className="text-foreground"><strong>{t("accountNumber")}:</strong> {invoice.seller!.account_number}</p>}
              {invoice.seller!.swift_code && <p className="text-foreground"><strong>{t("swiftBicCode")}:</strong> {invoice.seller!.swift_code}</p>}
              {invoice.seller!.bank_name && <p className="text-foreground"><strong>{t("bankName")}:</strong> {invoice.seller!.bank_name}</p>}
              {invoice.seller!.bank_region && <p className="text-foreground"><strong>{t("bankRegion")}:</strong> {invoice.seller!.bank_region}</p>}
              {invoice.seller!.bank_code && <p className="text-foreground"><strong>{t("bankCode")}:</strong> {invoice.seller!.bank_code}</p>}
              {invoice.seller!.branch_code && <p className="text-foreground"><strong>{t("branchCode")}:</strong> {invoice.seller!.branch_code}</p>}
              {invoice.seller!.bank_address && <p className="text-foreground"><strong>{t("bankAddress")}:</strong> {invoice.seller!.bank_address}</p>}
            </div>
          </div>
        )}

        {/* Product Items + Invoice Summary — forced onto a new page in print */}
        <div className="invoice-print-page-break">
        {/* Product Items Table */}
        {invoice.items && invoice.items.length > 0 && (
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
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="text-sm text-foreground font-mono">
                          {item.item_code}
                          {item.product_name && (
                            <span className="ml-1 font-sans">{item.product_name}</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">
                          {item.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-foreground">{formatCurrency(item.unit_price, "USD", intlLocale)}</TableCell>
                      <TableCell className="text-right text-foreground">{item.quantity}</TableCell>
                      <TableCell className="text-right font-medium text-foreground">{formatCurrency(item.total, "USD", intlLocale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Invoice Summary */}
        <Card className="invoice-summary-card">
          <CardContent className="space-y-2 text-sm max-w-xs ml-auto pt-6">
            <div className="flex justify-between"><span className="text-foreground">{tOrders("subtotal")}</span><span className="text-foreground">{formatCurrency(invoice.subtotal, "USD", intlLocale)}</span></div>
            {invoice.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-foreground">{t("discount")}</span>
                <span className="text-foreground">({formatCurrency(invoice.discount, "USD", intlLocale)})</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold"><span className="text-foreground">{tCommon("total")}</span><span className="text-foreground">{formatCurrency(invoice.total, "USD", intlLocale)}</span></div>
            {invoice.amount_paid > 0 && (
              <div className="flex justify-between text-green-600"><span>{t("amountPaid")}</span><span>{formatCurrency(invoice.amount_paid, "USD", intlLocale)}</span></div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold text-lg invoice-amount-due"><span className="text-foreground">{t("amountDue")}</span><span className="text-foreground">{formatCurrency(invoice.amount_due, "USD", intlLocale)}</span></div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
