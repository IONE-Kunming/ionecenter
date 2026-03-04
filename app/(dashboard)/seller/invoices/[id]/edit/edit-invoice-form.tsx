"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/ui/status-badge"
import { useToast } from "@/components/ui/toaster"
import { useFormatters } from "@/lib/use-formatters"
import { updateInvoice } from "@/lib/actions/invoices"
import Link from "@/components/ui/link"
import type { Invoice } from "@/types/database"

interface ItemRow {
  name: string
  description: string
  quantity: number
  unit: string
  price: number
}

export function EditInvoiceForm({ invoice }: { invoice: Invoice }) {
  const router = useRouter()
  const t = useTranslations("invoices")
  const tCommon = useTranslations("common")
  const tOrders = useTranslations("orders")
  const tCreate = useTranslations("invoiceCreate")
  const { formatCurrency, formatDate } = useFormatters()
  const { addToast } = useToast()
  const [saving, setSaving] = useState(false)

  const [items, setItems] = useState<ItemRow[]>(
    invoice.items && invoice.items.length > 0
      ? invoice.items.map((item) => ({
          name: item.name,
          description: item.description ?? "",
          quantity: item.quantity,
          unit: item.unit ?? "m",
          price: item.price,
        }))
      : [{ name: "", description: "", quantity: 1, unit: "m", price: 0 }]
  )
  const [discount, setDiscount] = useState(invoice.discount ?? 0)
  const [depositPaid, setDepositPaid] = useState(invoice.deposit_paid ?? 0)
  const [notes, setNotes] = useState(invoice.notes ?? "")

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = Math.max(subtotal - discount + (invoice.tax ?? 0), 0)
  const remainingBalance = Math.max(total - depositPaid, 0)

  const updateItem = (index: number, field: keyof ItemRow, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const addItem = () => {
    setItems((prev) => [...prev, { name: "", description: "", quantity: 1, unit: "m", price: 0 }])
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (items.length === 0 || items.every((r) => !r.name.trim())) {
      addToast("error", tCreate("addAtLeastOneProduct"))
      return
    }

    setSaving(true)
    try {
      const result = await updateInvoice(invoice.id, {
        items: items.filter((r) => r.name.trim()).map((r) => ({
          name: r.name,
          description: r.description,
          quantity: r.quantity,
          unit: r.unit,
          price: r.price,
        })),
        discount,
        deposit_paid: depositPaid,
        notes,
      })

      if (result.error) {
        addToast("error", result.error)
      } else {
        addToast("success", tCreate("invoiceUpdatedSuccess"))
        router.push("/seller/invoices")
      }
    } catch {
      addToast("error", tCreate("invoiceSaveFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link href="/seller/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("backToInvoices")}
        </Link>
      </div>

      <h1 className="text-2xl font-bold">{t("editInvoice")}</h1>

      {/* Invoice Info (read-only) */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{t("invoice")} {invoice.invoice_number}</h2>
          <p className="text-sm text-muted-foreground">{formatDate(invoice.created_at)}</p>
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
            {invoice.due_date && <p>{t("due")} {formatDate(invoice.due_date)}</p>}
            {invoice.payment_terms && <p>{t("terms")} {invoice.payment_terms}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Editable Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("items")}</CardTitle>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> {tCreate("addItem")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("item")}</TableHead>
                <TableHead>{t("description")}</TableHead>
                <TableHead className="text-right w-[100px]">{t("qty")}</TableHead>
                <TableHead className="text-right w-[120px]">{t("unitPrice")}</TableHead>
                <TableHead className="text-right w-[120px]">{tCommon("total")}</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(index, "name", e.target.value)}
                      placeholder={t("item")}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      placeholder={t("description")}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                      className="text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.price}
                      onChange={(e) => updateItem(index, "price", Number(e.target.value))}
                      className="text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </TableCell>
                  <TableCell>
                    {items.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Editable Summary */}
      <Card>
        <CardHeader><CardTitle>{tOrders("paymentSummary")}</CardTitle></CardHeader>
        <CardContent className="space-y-4 max-w-sm ml-auto">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{tOrders("subtotal")}</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">{t("discount")}</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="max-w-[150px] text-right"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{tOrders("tax")}</span>
            <span>{formatCurrency(invoice.tax ?? 0)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold text-sm">
            <span>{tCommon("total")}</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm text-green-600 whitespace-nowrap">{tOrders("depositPaid")}</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={depositPaid}
              onChange={(e) => setDepositPaid(Number(e.target.value))}
              className="max-w-[150px] text-right"
            />
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold text-sm">
            <span>{tOrders("remainingBalance")}</span>
            <span>{formatCurrency(remainingBalance)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle className="text-sm">{t("notes")}</CardTitle></CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={t("notes")}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Link href="/seller/invoices">
          <Button variant="outline">{tCommon("cancel")}</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {tCreate("updateInvoice")}
        </Button>
      </div>
    </div>
  )
}
