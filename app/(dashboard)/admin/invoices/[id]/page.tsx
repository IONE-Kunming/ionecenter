import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "@/components/ui/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/ui/status-badge"
import { formatCurrency, formatDate, getIntlLocale } from "@/lib/utils"
import { getInvoice } from "@/lib/actions/invoices"
import { getLocale } from "next-intl/server"

const getCachedInvoice = cache(getInvoice)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const invoice = await getCachedInvoice(id)
  if (!invoice) return { title: "Invoice Details" }
  return { title: `Invoice ${invoice.invoice_number}` }
}

export default async function AdminInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getCachedInvoice(id)

  if (!invoice) notFound()

  const locale = await getLocale()
  const intlLocale = getIntlLocale(locale)

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/admin/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Invoices
      </Link>

      {/* Company Logo */}
      <div className="flex items-center gap-3">
        <Image src="/logo.svg" alt="IONE Center" width={120} height={40} />
      </div>

      {/* Seller Bank Information */}
      {invoice.seller && (invoice.seller.account_name || invoice.seller.account_number || invoice.seller.bank_name) && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Bank Information</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            {invoice.seller.account_name && <p><strong>Account Holder:</strong> {invoice.seller.account_name}</p>}
            {invoice.seller.account_number && <p><strong>Account Number:</strong> {invoice.seller.account_number}</p>}
            {invoice.seller.swift_code && <p><strong>SWIFT/BIC Code:</strong> {invoice.seller.swift_code}</p>}
            {invoice.seller.bank_name && <p><strong>Bank Name:</strong> {invoice.seller.bank_name}</p>}
            {invoice.seller.bank_region && <p><strong>Bank Region:</strong> {invoice.seller.bank_region}</p>}
            {invoice.seller.bank_code && <p><strong>Bank Code:</strong> {invoice.seller.bank_code}</p>}
            {invoice.seller.branch_code && <p><strong>Branch Code:</strong> {invoice.seller.branch_code}</p>}
            {invoice.seller.bank_address && <p><strong>Bank Address:</strong> {invoice.seller.bank_address}</p>}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Invoice {invoice.invoice_number}</h2>
          <p className="text-sm text-muted-foreground">{formatDate(invoice.created_at, intlLocale)}</p>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Buyer</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{invoice.buyer?.display_name ?? "Unknown"}</p>
            <p className="text-muted-foreground">{invoice.buyer?.company ?? ""}</p>
            <p className="text-muted-foreground">{invoice.buyer?.email ?? ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Seller</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{invoice.seller?.display_name ?? "Unknown"}</p>
            <p className="text-muted-foreground">{invoice.seller?.company ?? ""}</p>
            <p className="text-muted-foreground">{invoice.seller?.email ?? ""}</p>
          </CardContent>
        </Card>
      </div>

      {invoice.items && invoice.items.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Items</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
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
        <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm max-w-xs ml-auto">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(invoice.subtotal, "USD", intlLocale)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(invoice.tax, "USD", intlLocale)}</span></div>
          <div className="border-t pt-2 flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(invoice.total, "USD", intlLocale)}</span></div>
          <div className="flex justify-between text-green-600"><span>Deposit Paid</span><span>-{formatCurrency(invoice.deposit_paid, "USD", intlLocale)}</span></div>
          <div className="border-t pt-2 flex justify-between font-semibold"><span>Remaining Balance</span><span>{formatCurrency(invoice.remaining_balance, "USD", intlLocale)}</span></div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {invoice.due_date && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Due Date</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{formatDate(invoice.due_date, intlLocale)}</p></CardContent>
          </Card>
        )}
        {invoice.payment_terms && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Payment Terms</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{invoice.payment_terms}</p></CardContent>
          </Card>
        )}
      </div>

      {invoice.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{invoice.notes}</p></CardContent>
        </Card>
      )}
    </div>
  )
}
