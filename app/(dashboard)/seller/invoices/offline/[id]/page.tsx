import { notFound } from "next/navigation"
import Link from "@/components/ui/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate, getIntlLocale } from "@/lib/utils"
import { getOfflineInvoice } from "@/lib/actions/invoices"
import { getTranslations, getLocale } from "next-intl/server"
import { PrintTrigger } from "./print-trigger"

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
      <div className="print:hidden">
        <Link href="/seller/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("backToInvoices")}
        </Link>
      </div>

      {print === "true" && <PrintTrigger />}

      <div className="space-y-6 invoice-print-area">
        {/* Screen-only header: logo + invoice number + status */}
        <div className="flex items-start justify-between invoice-screen-header">
          <Image src="/logo.svg" alt="IONE Center" width={120} height={40} />
          <div className="text-right">
            <h2 className="text-xl font-bold">{t("invoice")} {invoice.invoice_number}</h2>
            <p className="text-sm text-muted-foreground">{formatDate(invoice.created_at, intlLocale)}</p>
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium mt-1 ${invoice.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Print-only Professional Header */}
        <div className="hidden print:block invoice-print-header">
          <div style={{ textAlign: "center" }}>
            <Image src="/logo.svg" alt="IONE Center" width={140} height={46} style={{ margin: "0 auto" }} />
          </div>
        </div>

        {/* Print-only Invoice Info Row */}
        <div className="hidden print:block invoice-info-row">
          <div className="invoice-info-left">
            <p><strong>{t("invoiceNumber")}:</strong> {invoice.invoice_number}</p>
            <p><strong>{tCommon("date")}:</strong> {new Date(invoice.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
          </div>
          <div className="invoice-info-right">
            <p><strong>{t("supplier")}</strong></p>
            {invoice.seller?.display_name && <p>{invoice.seller.display_name}</p>}
          </div>
        </div>

        {/* Print-only: Buyer Information Section */}
        <div className="hidden print:block invoice-print-section">
          <h3 className="invoice-print-section-title">{t("buyerInformation")}</h3>
          <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
            <p><strong>{t("buyerCode")}:</strong> {invoice.buyer_code || "—"}</p>
            <p><strong>{t("buyerName")}:</strong> {invoice.buyer_name || "—"}</p>
            <p><strong>{t("buyerEmail")}:</strong> {invoice.buyer_email || "—"}</p>
          </div>
        </div>

        {/* Print-only: Seller Information Section */}
        <div className="hidden print:block invoice-print-section">
          <h3 className="invoice-print-section-title">{t("sellerInformation")}</h3>
          <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
            <p><strong>{t("sellerCode")}:</strong> {invoice.seller?.user_code || "—"}</p>
            <p><strong>{t("sellerName")}:</strong> {invoice.seller?.display_name || "—"}</p>
            <p><strong>{t("sellerEmail")}:</strong> {invoice.seller?.email || "—"}</p>
          </div>
        </div>

        {/* Print-only: Buyer Bank Information TT (conditional) */}
        {hasBuyerBank && (
          <div className="hidden print:block invoice-print-section">
            <h3 className="invoice-print-section-title">{t("buyerBankInformation")}</h3>
            <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
              {invoice.buyer_bank!.account_name && <p><strong>{t("accountHolder")}:</strong> {invoice.buyer_bank!.account_name}</p>}
              {invoice.buyer_bank!.account_number && <p><strong>{t("accountNumber")}:</strong> {invoice.buyer_bank!.account_number}</p>}
              {invoice.buyer_bank!.swift_code && <p><strong>{t("swiftBicCode")}:</strong> {invoice.buyer_bank!.swift_code}</p>}
              {invoice.buyer_bank!.bank_name && <p><strong>{t("bankName")}:</strong> {invoice.buyer_bank!.bank_name}</p>}
              {invoice.buyer_bank!.bank_region && <p><strong>{t("bankRegion")}:</strong> {invoice.buyer_bank!.bank_region}</p>}
              {invoice.buyer_bank!.bank_code && <p><strong>{t("bankCode")}:</strong> {invoice.buyer_bank!.bank_code}</p>}
              {invoice.buyer_bank!.branch_code && <p><strong>{t("branchCode")}:</strong> {invoice.buyer_bank!.branch_code}</p>}
              {invoice.buyer_bank!.bank_address && <p><strong>{t("bankAddress")}:</strong> {invoice.buyer_bank!.bank_address}</p>}
            </div>
          </div>
        )}

        {/* Print-only: Seller Bank Information */}
        {hasSellerBank && (
          <div className="hidden print:block invoice-print-section">
            <h3 className="invoice-print-section-title">{t("bankInformation")}</h3>
            <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
              {invoice.seller!.account_name && <p><strong>{t("accountHolder")}:</strong> {invoice.seller!.account_name}</p>}
              {invoice.seller!.account_number && <p><strong>{t("accountNumber")}:</strong> {invoice.seller!.account_number}</p>}
              {invoice.seller!.swift_code && <p><strong>{t("swiftBicCode")}:</strong> {invoice.seller!.swift_code}</p>}
              {invoice.seller!.bank_name && <p><strong>{t("bankName")}:</strong> {invoice.seller!.bank_name}</p>}
              {invoice.seller!.bank_region && <p><strong>{t("bankRegion")}:</strong> {invoice.seller!.bank_region}</p>}
              {invoice.seller!.bank_code && <p><strong>{t("bankCode")}:</strong> {invoice.seller!.bank_code}</p>}
              {invoice.seller!.branch_code && <p><strong>{t("branchCode")}:</strong> {invoice.seller!.branch_code}</p>}
              {invoice.seller!.bank_address && <p><strong>{t("bankAddress")}:</strong> {invoice.seller!.bank_address}</p>}
            </div>
          </div>
        )}

        {/* Screen-only: Buyer Information Card */}
        <Card className="print:hidden">
          <CardHeader><CardTitle className="text-sm">{t("buyer")}</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{invoice.buyer_name ?? tCommon("unknown")}</p>
            {invoice.buyer_code && <p className="text-muted-foreground">{invoice.buyer_code}</p>}
            {invoice.buyer_email && <p className="text-muted-foreground">{invoice.buyer_email}</p>}
          </CardContent>
        </Card>

        {/* Screen-only: Seller Information Card */}
        {invoice.seller && (
          <Card className="print:hidden">
            <CardHeader><CardTitle className="text-sm">{t("sellerInformation")}</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              {invoice.seller.user_code && <p className="text-muted-foreground">{invoice.seller.user_code}</p>}
              <p className="font-medium">{invoice.seller.display_name}</p>
              {invoice.seller.email && <p className="text-muted-foreground">{invoice.seller.email}</p>}
            </CardContent>
          </Card>
        )}

        {/* Screen-only: Buyer Bank Information */}
        {hasBuyerBank && (
          <Card className="print:hidden">
            <CardHeader><CardTitle className="text-sm">{t("buyerBankInformation")}</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              {invoice.buyer_bank!.account_name && <p><strong>{t("accountHolder")}:</strong> {invoice.buyer_bank!.account_name}</p>}
              {invoice.buyer_bank!.account_number && <p><strong>{t("accountNumber")}:</strong> {invoice.buyer_bank!.account_number}</p>}
              {invoice.buyer_bank!.swift_code && <p><strong>{t("swiftBicCode")}:</strong> {invoice.buyer_bank!.swift_code}</p>}
              {invoice.buyer_bank!.bank_name && <p><strong>{t("bankName")}:</strong> {invoice.buyer_bank!.bank_name}</p>}
              {invoice.buyer_bank!.bank_region && <p><strong>{t("bankRegion")}:</strong> {invoice.buyer_bank!.bank_region}</p>}
              {invoice.buyer_bank!.bank_code && <p><strong>{t("bankCode")}:</strong> {invoice.buyer_bank!.bank_code}</p>}
              {invoice.buyer_bank!.branch_code && <p><strong>{t("branchCode")}:</strong> {invoice.buyer_bank!.branch_code}</p>}
              {invoice.buyer_bank!.bank_address && <p><strong>{t("bankAddress")}:</strong> {invoice.buyer_bank!.bank_address}</p>}
            </CardContent>
          </Card>
        )}

        {/* Screen-only: Seller Bank Information */}
        {hasSellerBank && (
          <Card className="print:hidden">
            <CardHeader><CardTitle className="text-sm">{t("bankInformation")}</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              {invoice.seller!.account_name && <p><strong>{t("accountHolder")}:</strong> {invoice.seller!.account_name}</p>}
              {invoice.seller!.account_number && <p><strong>{t("accountNumber")}:</strong> {invoice.seller!.account_number}</p>}
              {invoice.seller!.swift_code && <p><strong>{t("swiftBicCode")}:</strong> {invoice.seller!.swift_code}</p>}
              {invoice.seller!.bank_name && <p><strong>{t("bankName")}:</strong> {invoice.seller!.bank_name}</p>}
              {invoice.seller!.bank_region && <p><strong>{t("bankRegion")}:</strong> {invoice.seller!.bank_region}</p>}
              {invoice.seller!.bank_code && <p><strong>{t("bankCode")}:</strong> {invoice.seller!.bank_code}</p>}
              {invoice.seller!.branch_code && <p><strong>{t("branchCode")}:</strong> {invoice.seller!.branch_code}</p>}
              {invoice.seller!.bank_address && <p><strong>{t("bankAddress")}:</strong> {invoice.seller!.bank_address}</p>}
            </CardContent>
          </Card>
        )}

        {/* Product Items + Invoice Summary — forced onto a new page in print */}
        <div className="invoice-print-page-break">
        {/* Invoice Items */}
        {invoice.items && invoice.items.length > 0 && (
          <Card>
            <CardHeader><CardTitle>{t("items")}</CardTitle></CardHeader>
            <CardContent>
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
                        <span className="text-xs text-muted-foreground font-mono">
                          {item.item_code}
                          {item.product_name && (
                            <span className="ml-1 font-sans">{item.product_name}</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {item.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price, "USD", intlLocale)}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.total, "USD", intlLocale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Invoice Summary */}
        <Card className="invoice-summary-card">
          <CardHeader className="print:hidden"><CardTitle>{tOrders("paymentSummary")}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm max-w-xs ml-auto">
            <div className="flex justify-between"><span className="text-muted-foreground">{tOrders("subtotal")}</span><span>{formatCurrency(invoice.subtotal, "USD", intlLocale)}</span></div>
            {invoice.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("discount")}</span>
                <span>({formatCurrency(invoice.discount, "USD", intlLocale)})</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold"><span>{tCommon("total")}</span><span>{formatCurrency(invoice.total, "USD", intlLocale)}</span></div>
            {invoice.amount_paid > 0 && (
              <div className="flex justify-between text-green-600"><span>{t("amountPaid")}</span><span>{formatCurrency(invoice.amount_paid, "USD", intlLocale)}</span></div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold text-lg invoice-amount-due"><span>{t("amountDue")}</span><span>{formatCurrency(invoice.amount_due, "USD", intlLocale)}</span></div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
