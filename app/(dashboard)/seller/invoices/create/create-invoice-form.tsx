"use client"

import { useState, useCallback, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Printer, Send, Save, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/toaster"
import Link from "@/components/ui/link"
import { formatCurrency } from "@/lib/utils"
import { createOfflineInvoice, searchSellerProducts } from "@/lib/actions/invoices"

interface ProductResult {
  id: string
  name: string
  model_number: string
  description: string | null
  price_per_meter: number
}

interface InvoiceRow {
  key: string
  productName: string
  description: string
  unitPrice: number
  quantity: number
  searchQuery: string
  suggestions: ProductResult[]
  showSuggestions: boolean
}

const BANK_INFO = {
  accountHolder: "HK KANDIVAN INTERNATIONAL TRADING COMPANY LIMITED",
  accountNumber: "342801259",
  swiftCode: "CITIHKHX",
  bankName: "CITIBANK N.A. HONG KONG BRANCH",
  bankRegion: "HK",
  bankCode: "006",
  branchCode: "391",
  bankAddress: "Champion Tower, THREE Garden Road, Central, Hong Kong 🇭🇰",
}

function generateItemKey(index: number): string {
  return `RX${String(index + 1).padStart(3, "0")}`
}

export function CreateOfflineInvoiceForm() {
  const router = useRouter()
  const { addToast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)

  const [buyerName, setBuyerName] = useState("")
  const [buyerEmail, setBuyerEmail] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [discount, setDiscount] = useState(0)
  const [amountPaid, setAmountPaid] = useState(0)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [savedInvoiceNumber, setSavedInvoiceNumber] = useState<string | null>(null)
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null)

  const [rows, setRows] = useState<InvoiceRow[]>([
    {
      key: generateItemKey(0),
      productName: "",
      description: "",
      unitPrice: 0,
      quantity: 1,
      searchQuery: "",
      suggestions: [],
      showSuggestions: false,
    },
  ])

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleProductSearch = useCallback(
    async (rowIndex: number, query: string) => {
      setRows((prev) =>
        prev.map((r, i) =>
          i === rowIndex ? { ...r, searchQuery: query, showSuggestions: true } : r
        )
      )

      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)

      if (query.length < 2) {
        setRows((prev) =>
          prev.map((r, i) =>
            i === rowIndex ? { ...r, suggestions: [], showSuggestions: false } : r
          )
        )
        return
      }

      searchTimerRef.current = setTimeout(async () => {
        const results = await searchSellerProducts(query)
        setRows((prev) =>
          prev.map((r, i) =>
            i === rowIndex ? { ...r, suggestions: results, showSuggestions: true } : r
          )
        )
      }, 300)
    },
    []
  )

  const selectProduct = useCallback(
    (rowIndex: number, product: ProductResult) => {
      setRows((prev) =>
        prev.map((r, i) =>
          i === rowIndex
            ? {
                ...r,
                productName: product.name,
                description: product.description ?? "",
                unitPrice: product.price_per_meter,
                searchQuery: product.model_number,
                suggestions: [],
                showSuggestions: false,
              }
            : r
        )
      )
    },
    []
  )

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        key: generateItemKey(prev.length),
        productName: "",
        description: "",
        unitPrice: 0,
        quantity: 1,
        searchQuery: "",
        suggestions: [],
        showSuggestions: false,
      },
    ])
  }, [])

  const removeRow = useCallback((index: number) => {
    setRows((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((r, i) => ({ ...r, key: generateItemKey(i) }))
    })
  }, [])

  const updateRow = useCallback(
    (index: number, field: "quantity" | "unitPrice", value: number) => {
      setRows((prev) =>
        prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
      )
    },
    []
  )

  // Calculations
  const subtotal = rows.reduce((sum, r) => sum + r.unitPrice * r.quantity, 0)
  const total = Math.max(subtotal - discount, 0)
  const amountDue = Math.max(total - amountPaid, 0)

  const handleSave = async () => {
    if (!buyerName.trim()) {
      addToast("error", "Buyer name is required")
      return
    }
    if (!buyerEmail.trim()) {
      addToast("error", "Buyer email is required")
      return
    }
    if (rows.length === 0 || rows.every((r) => !r.productName.trim())) {
      addToast("error", "Add at least one product")
      return
    }

    setSaving(true)
    try {
      const result = await createOfflineInvoice({
        buyer_name: buyerName.trim(),
        buyer_email: buyerEmail.trim(),
        items: rows
          .filter((r) => r.productName.trim())
          .map((r) => ({
            name: `${r.key} — ${r.productName}`,
            description: r.description,
            unit_price: r.unitPrice,
            quantity: r.quantity,
          })),
        discount,
        amount_paid: amountPaid,
      })

      if (result.error) {
        addToast("error", result.error)
      } else if (result.invoice) {
        setSavedInvoiceNumber(result.invoice.invoice_number)
        setSavedInvoiceId(result.invoice.id)
        addToast("success", `Invoice ${result.invoice.invoice_number} created successfully`)
      }
    } catch {
      addToast("error", "Failed to save invoice")
    } finally {
      setSaving(false)
    }
  }

  const handleSendEmail = async () => {
    if (!savedInvoiceNumber) {
      addToast("error", "Please save the invoice first")
      return
    }
    if (!buyerEmail.trim()) {
      addToast("error", "Buyer email is required")
      return
    }

    setSending(true)
    try {
      const res = await fetch("/api/invoices/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerEmail: buyerEmail.trim(),
          buyerName: buyerName.trim(),
          invoiceNumber: savedInvoiceNumber,
          invoiceDate,
          items: rows
            .filter((r) => r.productName.trim())
            .map((r) => ({
              name: r.productName,
              description: r.description,
              unitPrice: r.unitPrice,
              quantity: r.quantity,
              total: r.unitPrice * r.quantity,
            })),
          subtotal,
          discount,
          total,
          amountPaid,
          amountDue,
        }),
      })

      const data = await res.json()
      if (data.error) {
        addToast("error", data.error)
      } else {
        addToast("success", `Invoice sent to ${buyerEmail}`)
      }
    } catch {
      addToast("error", "Failed to send email")
    } finally {
      setSending(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="print:hidden">
        <Link
          href="/seller/invoices"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>
      </div>

      <div ref={printRef} className="space-y-6">
        {/* Invoice Header */}
        <div className="flex items-start justify-between">
          <Image src="/logo.svg" alt="IONE Center" width={120} height={40} />
          <div className="text-right">
            <h2 className="text-xl font-bold">
              {savedInvoiceNumber ? `Invoice ${savedInvoiceNumber}` : "New Invoice"}
            </h2>
            <div className="mt-1 print:hidden">
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-40 ml-auto text-right"
              />
            </div>
            <p className="hidden print:block text-sm text-muted-foreground">
              Date: {new Date(invoiceDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* Buyer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Buyer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyerName">Buyer Name</Label>
                <Input
                  id="buyerName"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Enter buyer name"
                  className="print:border-none print:p-0 print:shadow-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyerEmail">Buyer Email</Label>
                <Input
                  id="buyerEmail"
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="Enter buyer email"
                  className="print:border-none print:p-0 print:shadow-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Product Items</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={addRow}
              className="print:hidden"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[260px]">Item</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right w-[120px]">Unit Price</TableHead>
                  <TableHead className="text-right w-[90px]">Quantity</TableHead>
                  <TableHead className="text-right w-[120px]">Total</TableHead>
                  <TableHead className="w-[50px] print:hidden" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="relative">
                        <span className="text-xs text-muted-foreground font-mono">
                          {row.key}
                        </span>
                        <Input
                          value={row.searchQuery}
                          onChange={(e) => handleProductSearch(i, e.target.value)}
                          onBlur={() => {
                            setTimeout(() => {
                              setRows((prev) =>
                                prev.map((r, idx) =>
                                  idx === i ? { ...r, showSuggestions: false } : r
                                )
                              )
                            }, 200)
                          }}
                          placeholder="Type model number..."
                          className="mt-1 text-sm print:border-none print:p-0 print:shadow-none"
                        />
                        {row.showSuggestions && row.suggestions.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto print:hidden">
                            {row.suggestions.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => selectProduct(i, product)}
                              >
                                <span className="font-medium">{product.model_number}</span>
                                <span className="text-muted-foreground ml-2">
                                  — {product.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        {row.productName && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {row.productName}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {row.description || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={row.unitPrice || ""}
                        onChange={(e) => updateRow(i, "unitPrice", Number(e.target.value))}
                        className="w-24 ml-auto text-right print:border-none print:p-0 print:shadow-none"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(e) =>
                          updateRow(i, "quantity", Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-20 ml-auto text-right print:border-none print:p-0 print:shadow-none"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(row.unitPrice * row.quantity)}
                    </TableCell>
                    <TableCell className="print:hidden">
                      {rows.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(i)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Invoice Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm max-w-xs ml-auto">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Discount</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-28 text-right print:border-none print:p-0 print:shadow-none"
              />
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between items-center text-green-600">
              <span>Amount Paid</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={amountPaid || ""}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="w-28 text-right text-green-600 print:border-none print:p-0 print:shadow-none"
              />
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold text-lg">
              <span>Amount Due</span>
              <span>{formatCurrency(amountDue)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              <strong>Account Holder:</strong> {BANK_INFO.accountHolder}
            </p>
            <p>
              <strong>Account Number:</strong> {BANK_INFO.accountNumber}
            </p>
            <p>
              <strong>SWIFT/BIC Code:</strong> {BANK_INFO.swiftCode}
            </p>
            <p>
              <strong>Bank Name:</strong> {BANK_INFO.bankName}
            </p>
            <p>
              <strong>Bank Region:</strong> {BANK_INFO.bankRegion}
            </p>
            <p>
              <strong>Bank Code:</strong> {BANK_INFO.bankCode}
            </p>
            <p>
              <strong>Branch Code:</strong> {BANK_INFO.branchCode}
            </p>
            <p>
              <strong>Bank Address:</strong> {BANK_INFO.bankAddress}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 print:hidden">
        <Button onClick={handleSave} disabled={saving || !!savedInvoiceId}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {savedInvoiceId ? "Saved" : "Save Invoice"}
        </Button>
        <Button
          variant="outline"
          onClick={handleSendEmail}
          disabled={sending || !savedInvoiceId}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send Invoice
        </Button>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" /> Print Invoice
        </Button>
        {savedInvoiceId && (
          <Button
            variant="secondary"
            onClick={() => router.push("/seller/invoices")}
          >
            View All Invoices
          </Button>
        )}
      </div>
    </div>
  )
}
