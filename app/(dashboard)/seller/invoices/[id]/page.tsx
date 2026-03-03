import { notFound } from "next/navigation"
import Link from "@/components/ui/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/ui/status-badge"
import { formatCurrency, formatDate, getIntlLocale } from "@/lib/utils"
import { getInvoice } from "@/lib/actions/invoices"
import { getTranslations, getLocale } from "next-intl/server"

export default async function SellerInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getInvoice(id)

  if (!invoice) notFound()

  const t = await getTranslations("invoices")
  const tOrders = await getTranslations("orders")
  const tCommon = await getTranslations("common")
  const locale = await getLocale()
  const intlLocale = getIntlLocale(locale)

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/seller/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("backToInvoices")}
      </Link>

      <h1 className="text-2xl font-bold">{t("invoiceDetails")}</h1>

      {/* Company Logo */}
      <div className="flex items-center gap-3">
        <Image src="/logo.svg" alt="IONE Center" width={120} height={40} />
      </div>

      {/* Seller Bank Information */}
      {invoice.seller && (invoice.seller.account_name || invoice.seller.account_number || invoice.seller.bank_name) && (
        <Card>
          <CardHeader><CardTitle className="text-sm">{t("bankInformation")}</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            {invoice.seller.account_name && <p><strong>{t("accountHolder")}:</strong> {invoice.seller.account_name}</p>}
            {invoice.seller.account_number && <p><strong>{t("accountNumber")}:</strong> {invoice.seller.account_number}</p>}
            {invoice.seller.swift_code && <p><strong>{t("swiftBicCode")}:</strong> {invoice.seller.swift_code}</p>}
            {invoice.seller.bank_name && <p><strong>{t("bankName")}:</strong> {invoice.seller.bank_name}</p>}
            {invoice.seller.bank_region && <p><strong>{t("bankRegion")}:</strong> {invoice.seller.bank_region}</p>}
            {invoice.seller.bank_code && <p><strong>{t("bankCode")}:</strong> {invoice.seller.bank_code}</p>}
            {invoice.seller.branch_code && <p><strong>{t("branchCode")}:</strong> {invoice.seller.branch_code}</p>}
            {invoice.seller.bank_address && <p><strong>{t("bankAddress")}:</strong> {invoice.seller.bank_address}</p>}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{t("invoice")} {invoice.invoice_number}</h2>
          <p className="text-sm text-muted-foreground">{formatDate(invoice.created_at, intlLocale)}</p>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">{t("buyer")}</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{invoice.buyer?.display_name ?? tCommon("unknown")}</p>
            <p className="text-muted-foreground">{invoice.buyer?.company ?? ""}</p>
            <p className="text-muted-foreground">{invoice.buyer?.email ?? ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">{t("details")}</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            {invoice.due_date && <p>{t("due")} {formatDate(invoice.due_date, intlLocale)}</p>}
            {invoice.payment_terms && <p>{t("terms")} {invoice.payment_terms}</p>}
            {invoice.paid_at && <p className="text-green-600">{t("paidLabel")} {formatDate(invoice.paid_at, intlLocale)}</p>}
          </CardContent>
        </Card>
      </div>

      {invoice.items && invoice.items.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t("items")}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("item")}</TableHead>
                  <TableHead className="text-right">{t("qty")}</TableHead>
                  <TableHead className="text-right">{t("unitPrice")}</TableHead>
                  <TableHead className="text-right">{tOrders("subtotal")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity} {item.unit ?? ""}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price, "USD", intlLocale)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.subtotal, "USD", intlLocale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>{tOrders("paymentSummary")}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm max-w-xs ml-auto">
          <div className="flex justify-between"><span className="text-muted-foreground">{tOrders("subtotal")}</span><span>{formatCurrency(invoice.subtotal, "USD", intlLocale)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{tOrders("tax")}</span><span>{formatCurrency(invoice.tax, "USD", intlLocale)}</span></div>
          <div className="border-t pt-2 flex justify-between font-semibold"><span>{tCommon("total")}</span><span>{formatCurrency(invoice.total, "USD", intlLocale)}</span></div>
          <div className="flex justify-between text-green-600"><span>{tOrders("depositPaid")}</span><span>-{formatCurrency(invoice.deposit_paid, "USD", intlLocale)}</span></div>
          <div className="border-t pt-2 flex justify-between font-semibold"><span>{tOrders("remainingBalance")}</span><span>{formatCurrency(invoice.remaining_balance, "USD", intlLocale)}</span></div>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">{t("notes")}</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{invoice.notes}</p></CardContent>
        </Card>
      )}

      {/* Buyer Bank Information (TT) */}
      {(invoice.buyer_bank_account_name || invoice.buyer_bank_account_number || invoice.buyer_bank_name) && (
        <Card>
          <CardHeader><CardTitle className="text-sm">{t("buyerBankInformation")}</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            {invoice.buyer_bank_account_name && <p><strong>{t("accountHolder")}:</strong> {invoice.buyer_bank_account_name}</p>}
            {invoice.buyer_bank_account_number && <p><strong>{t("accountNumber")}:</strong> {invoice.buyer_bank_account_number}</p>}
            {invoice.buyer_bank_swift_code && <p><strong>{t("swiftBicCode")}:</strong> {invoice.buyer_bank_swift_code}</p>}
            {invoice.buyer_bank_name && <p><strong>{t("bankName")}:</strong> {invoice.buyer_bank_name}</p>}
            {invoice.buyer_bank_region && <p><strong>{t("bankRegion")}:</strong> {invoice.buyer_bank_region}</p>}
            {invoice.buyer_bank_code && <p><strong>{t("bankCode")}:</strong> {invoice.buyer_bank_code}</p>}
            {invoice.buyer_bank_branch_code && <p><strong>{t("branchCode")}:</strong> {invoice.buyer_bank_branch_code}</p>}
            {invoice.buyer_bank_address && <p><strong>{t("bankAddress")}:</strong> {invoice.buyer_bank_address}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
