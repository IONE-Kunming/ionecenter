import { notFound } from "next/navigation"
import Link from "@/components/ui/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/ui/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getInvoice } from "@/lib/actions/invoices"
import { getTranslations } from "next-intl/server"

export default async function BuyerInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getInvoice(id)

  if (!invoice) notFound()

  const t = await getTranslations("invoices")
  const tOrders = await getTranslations("orders")
  const tCommon = await getTranslations("common")

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/buyer/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("backToInvoices")}
      </Link>

      {/* Company Logo */}
      <div className="flex items-center gap-3">
        <Image src="/logo.svg" alt="IONE Center" width={120} height={40} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{t("invoice")} {invoice.invoice_number}</h2>
          <p className="text-sm text-muted-foreground">{formatDate(invoice.created_at)}</p>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">{tOrders("seller")}</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{invoice.seller?.display_name ?? tCommon("unknown")}</p>
            <p className="text-muted-foreground">{invoice.seller?.company ?? ""}</p>
            <p className="text-muted-foreground">{invoice.seller?.email ?? ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">{t("details")}</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            {invoice.due_date && <p>{t("due")} {formatDate(invoice.due_date)}</p>}
            {invoice.payment_terms && <p>{t("terms")} {invoice.payment_terms}</p>}
            {invoice.paid_at && <p className="text-green-600">{t("paidLabel")} {formatDate(invoice.paid_at)}</p>}
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
                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
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
          <div className="flex justify-between"><span className="text-muted-foreground">{tOrders("subtotal")}</span><span>{formatCurrency(invoice.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{tOrders("tax")}</span><span>{formatCurrency(invoice.tax)}</span></div>
          <div className="border-t pt-2 flex justify-between font-semibold"><span>{tCommon("total")}</span><span>{formatCurrency(invoice.total)}</span></div>
          <div className="flex justify-between text-green-600"><span>{tOrders("depositPaid")}</span><span>-{formatCurrency(invoice.deposit_paid)}</span></div>
          <div className="border-t pt-2 flex justify-between font-semibold"><span>{tOrders("remainingBalance")}</span><span>{formatCurrency(invoice.remaining_balance)}</span></div>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">{t("notes")}</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{invoice.notes}</p></CardContent>
        </Card>
      )}
    </div>
  )
}
