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

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="print:hidden">
        <Link href="/seller/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("backToInvoices")}
        </Link>
      </div>

      {print === "true" && <PrintTrigger />}

      <div className="space-y-6 invoice-print-area">
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
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${invoice.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
            {invoice.status}
          </span>
        </div>

        {/* Buyer Information */}
        <Card>
          <CardHeader><CardTitle className="text-sm">{t("buyer")}</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{invoice.buyer_name ?? tCommon("unknown")}</p>
            {invoice.buyer_code && <p className="text-muted-foreground">{invoice.buyer_code}</p>}
            {invoice.buyer_email && <p className="text-muted-foreground">{invoice.buyer_email}</p>}
          </CardContent>
        </Card>

        {/* Invoice Items */}
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
                    <TableHead className="text-right">{tCommon("total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{item.product_name}</span>
                          {item.item_code && <span className="text-muted-foreground ml-2 text-xs">({item.item_code})</span>}
                        </div>
                        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price, "USD", intlLocale)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total, "USD", intlLocale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Invoice Summary */}
        <Card>
          <CardHeader><CardTitle>{tOrders("paymentSummary")}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm max-w-xs ml-auto">
            <div className="flex justify-between"><span className="text-muted-foreground">{tOrders("subtotal")}</span><span>{formatCurrency(invoice.subtotal, "USD", intlLocale)}</span></div>
            {invoice.discount > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatCurrency(invoice.discount, "USD", intlLocale)}</span></div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold"><span>{tCommon("total")}</span><span>{formatCurrency(invoice.total, "USD", intlLocale)}</span></div>
            {invoice.amount_paid > 0 && (
              <div className="flex justify-between text-green-600"><span>Amount Paid</span><span>-{formatCurrency(invoice.amount_paid, "USD", intlLocale)}</span></div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold"><span>Amount Due</span><span>{formatCurrency(invoice.amount_due, "USD", intlLocale)}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
