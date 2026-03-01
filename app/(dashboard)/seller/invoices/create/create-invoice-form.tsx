"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Printer, Send, Save, Loader2, AlertTriangle, User, Pencil, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/toaster"
import Link from "@/components/ui/link"
import { formatCurrency } from "@/lib/utils"
import { createOfflineInvoice, searchSellerProducts, getSellerBankInfo, searchBuyers, searchBuyerByCode, getNextSellerInvoiceNumber } from "@/lib/actions/invoices"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface ProductResult {
  id: string
  name: string
  model_number: string
  description: string | null
  price_per_meter: number
}

interface BankInfo {
  account_name: string | null
  account_number: string | null
  swift_code: string | null
  bank_name: string | null
  bank_region: string | null
  bank_code: string | null
  branch_code: string | null
  bank_address: string | null
  company: string | null
  display_name: string
  phone_number: string | null
  street: string | null
  city: string | null
  state: string | null
  country: string | null
}

interface BuyerResult {
  id: string
  display_name: string
  email: string
}

interface FoundBuyer {
  id: string
  display_name: string
  email: string
  user_code: string | null
  account_name: string | null
  account_number: string | null
  swift_code: string | null
  bank_name: string | null
  bank_region: string | null
  bank_code: string | null
  branch_code: string | null
  bank_address: string | null
}

interface BuyerBankInfo {
  account_name: string
  account_number: string
  swift_code: string
  bank_name: string
  bank_region: string
  bank_code: string
  branch_code: string
  bank_address: string
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

function generateItemKey(index: number): string {
  return `RX${String(index + 1).padStart(3, "0")}`
}

function formatLocation(city?: string | null, state?: string | null, country?: string | null): string {
  return [city, state, country].filter(Boolean).join(", ")
}

function hasBankInfo(info: BankInfo | null): boolean {
  if (!info) return false
  return !!(info.account_name || info.account_number || info.bank_name)
}

function hasBuyerBankInfo(info: BuyerBankInfo): boolean {
  return !!(info.account_name || info.account_number || info.bank_name)
}

const emptyBuyerBankInfo: BuyerBankInfo = {
  account_name: "",
  account_number: "",
  swift_code: "",
  bank_name: "",
  bank_region: "",
  bank_code: "",
  branch_code: "",
  bank_address: "",
}

export function CreateOfflineInvoiceForm() {
  const router = useRouter()
  const { addToast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)

  const [buyerName, setBuyerName] = useState("")
  const [buyerEmail, setBuyerEmail] = useState("")
  const [buyerSuggestions, setBuyerSuggestions] = useState<BuyerResult[]>([])
  const [showBuyerSuggestions, setShowBuyerSuggestions] = useState(false)
  const [buyerCode, setBuyerCode] = useState("")
  const [buyerCodeError, setBuyerCodeError] = useState<string | null>(null)
  const [buyerCodeSearching, setBuyerCodeSearching] = useState(false)
  const [foundBuyer, setFoundBuyer] = useState<FoundBuyer | null>(null)
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [discount, setDiscount] = useState(0)
  const [amountPaid, setAmountPaid] = useState(0)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [savedInvoiceNumber, setSavedInvoiceNumber] = useState<string | null>(null)
  const [autoInvoiceNumber, setAutoInvoiceNumber] = useState<string | null>(null)
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null)
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
  const [bankInfoLoaded, setBankInfoLoaded] = useState(false)
  const [buyerBankInfo, setBuyerBankInfo] = useState<BuyerBankInfo>({ ...emptyBuyerBankInfo })
  const [showBuyerBankSection, setShowBuyerBankSection] = useState(false)

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
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const buyerSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const buyerBlurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const buyerCodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
      if (buyerSearchTimerRef.current) clearTimeout(buyerSearchTimerRef.current)
      if (buyerBlurTimerRef.current) clearTimeout(buyerBlurTimerRef.current)
      if (buyerCodeTimerRef.current) clearTimeout(buyerCodeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    getSellerBankInfo().then((info) => {
      setBankInfo(info)
      setBankInfoLoaded(true)
    })
  }, [])

  useEffect(() => {
    getNextSellerInvoiceNumber().then((num) => {
      setAutoInvoiceNumber(num)
    })
  }, [])

  const handleBuyerSearch = useCallback(async (query: string) => {
    setBuyerName(query)
    setShowBuyerSuggestions(true)

    if (buyerSearchTimerRef.current) clearTimeout(buyerSearchTimerRef.current)

    if (query.length < 2) {
      setBuyerSuggestions([])
      setShowBuyerSuggestions(false)
      return
    }

    buyerSearchTimerRef.current = setTimeout(async () => {
      const results = await searchBuyers(query)
      setBuyerSuggestions(results)
      setShowBuyerSuggestions(true)
    }, 300)
  }, [])

  const selectBuyer = useCallback((buyer: BuyerResult) => {
    setBuyerName(buyer.display_name)
    setBuyerEmail(buyer.email)
    setBuyerSuggestions([])
    setShowBuyerSuggestions(false)
  }, [])

  const handleBuyerCodeSearch = useCallback((code: string) => {
    setBuyerCode(code)
    setBuyerCodeError(null)

    if (buyerCodeTimerRef.current) clearTimeout(buyerCodeTimerRef.current)

    if (code.trim().length < 2) {
      setBuyerCodeSearching(false)
      return
    }

    setBuyerCodeSearching(true)
    buyerCodeTimerRef.current = setTimeout(async () => {
      const result = await searchBuyerByCode(code.trim())
      if (result.error) {
        setBuyerCodeError(result.error)
        setBuyerCodeSearching(false)
      } else if (result.buyer) {
        setFoundBuyer(result.buyer)
        setBuyerName(result.buyer.display_name)
        setBuyerEmail(result.buyer.email)
        setBuyerCodeSearching(false)
        // Auto-fill buyer bank info if available
        const hasBuyerBank = !!(result.buyer.account_name || result.buyer.account_number || result.buyer.bank_name)
        if (hasBuyerBank) {
          setBuyerBankInfo({
            account_name: result.buyer.account_name ?? "",
            account_number: result.buyer.account_number ?? "",
            swift_code: result.buyer.swift_code ?? "",
            bank_name: result.buyer.bank_name ?? "",
            bank_region: result.buyer.bank_region ?? "",
            bank_code: result.buyer.bank_code ?? "",
            branch_code: result.buyer.branch_code ?? "",
            bank_address: result.buyer.bank_address ?? "",
          })
          setShowBuyerBankSection(true)
        }
      }
    }, 500)
  }, [])

  const clearFoundBuyer = useCallback(() => {
    setFoundBuyer(null)
    setBuyerCode("")
    setBuyerName("")
    setBuyerEmail("")
    setBuyerCodeError(null)
    setBuyerCodeSearching(false)
    setBuyerBankInfo({ ...emptyBuyerBankInfo })
    setShowBuyerBankSection(false)
  }, [])

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

  // The invoice number to display - use saved number after save, otherwise the auto-generated one
  const displayInvoiceNumber = savedInvoiceNumber || autoInvoiceNumber

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
        invoice_number: autoInvoiceNumber || undefined,
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
        ...(hasBuyerBankInfo(buyerBankInfo) ? {
          buyer_bank_account_name: buyerBankInfo.account_name || undefined,
          buyer_bank_account_number: buyerBankInfo.account_number || undefined,
          buyer_bank_swift_code: buyerBankInfo.swift_code || undefined,
          buyer_bank_name: buyerBankInfo.bank_name || undefined,
          buyer_bank_region: buyerBankInfo.bank_region || undefined,
          buyer_bank_code: buyerBankInfo.bank_code || undefined,
          buyer_bank_branch_code: buyerBankInfo.branch_code || undefined,
          buyer_bank_address: buyerBankInfo.bank_address || undefined,
        } : {}),
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

  const handleWhatsApp = async () => {
    if (!savedInvoiceNumber) {
      addToast("error", "Please save the invoice first")
      return
    }

    try {
      const element = printRef.current
      if (!element) return

      const canvas = await html2canvas(element, { scale: 2 })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Invoice-${savedInvoiceNumber}.pdf`)

      const message = encodeURIComponent(`Invoice ${savedInvoiceNumber} attached`)
      window.open(`https://wa.me/?text=${message}`, "_blank")
    } catch {
      addToast("error", "Failed to generate PDF")
    }
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

      <div ref={printRef} className="space-y-6 invoice-print-area">
        {/* Screen Invoice Header */}
        <div className="flex items-start justify-between print:hidden">
          <Image src="/logo.svg" alt="IONE Center" width={120} height={40} />
          <div className="text-right">
            <h2 className="text-xl font-bold">
              {displayInvoiceNumber ? `Invoice ${displayInvoiceNumber}` : "New Invoice"}
            </h2>
            <div className="mt-1">
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-40 ml-auto text-right"
              />
            </div>
          </div>
        </div>

        {/* Print-only Professional Header */}
        <div className="hidden print:block invoice-print-header">
          <div style={{ textAlign: "center" }}>
            <Image src="/logo.svg" alt="IONE Center" width={140} height={46} style={{ margin: "0 auto" }} />
            {bankInfo?.company && (
              <h1 className="invoice-company-name">{bankInfo.company}</h1>
            )}
            <div className="invoice-company-details">
              {bankInfo?.bank_address && <span>{bankInfo.bank_address}</span>}
              {bankInfo?.phone_number && <span> | {bankInfo.phone_number}</span>}
              {bankInfo?.city && <span> | {formatLocation(bankInfo.city, bankInfo.state, bankInfo.country)}</span>}
            </div>
          </div>
        </div>

        {/* Print-only Invoice Info Row */}
        <div className="hidden print:block invoice-info-row">
          <div className="invoice-info-left">
            <p><strong>Invoice Number:</strong> {displayInvoiceNumber || "—"}</p>
            <p><strong>Date:</strong> {new Date(invoiceDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
          </div>
          <div className="invoice-info-right">
            <p><strong>Supplier</strong></p>
            {bankInfo?.display_name && <p>{bankInfo.display_name}</p>}
            {bankInfo?.street && <p>{bankInfo.street}</p>}
            {bankInfo?.city && <p>{formatLocation(bankInfo.city, bankInfo.state)}</p>}
          </div>
        </div>

        {/* Bank Information (dynamic from seller settings) */}
        {bankInfoLoaded && !hasBankInfo(bankInfo) && (
          <div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200 print:hidden">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>Please add your bank information in settings before creating an invoice.</p>
            <Link href="/seller/profile" className="ml-auto underline whitespace-nowrap">
              Go to Settings
            </Link>
          </div>
        )}
        {hasBankInfo(bankInfo) && (
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="text-sm">Bank Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {bankInfo!.account_name && <p><strong>Account Holder:</strong> {bankInfo!.account_name}</p>}
              {bankInfo!.account_number && <p><strong>Account Number:</strong> {bankInfo!.account_number}</p>}
              {bankInfo!.swift_code && <p><strong>SWIFT/BIC Code:</strong> {bankInfo!.swift_code}</p>}
              {bankInfo!.bank_name && <p><strong>Bank Name:</strong> {bankInfo!.bank_name}</p>}
              {bankInfo!.bank_region && <p><strong>Bank Region:</strong> {bankInfo!.bank_region}</p>}
              {bankInfo!.bank_code && <p><strong>Bank Code:</strong> {bankInfo!.bank_code}</p>}
              {bankInfo!.branch_code && <p><strong>Branch Code:</strong> {bankInfo!.branch_code}</p>}
              {bankInfo!.bank_address && <p><strong>Bank Address:</strong> {bankInfo!.bank_address}</p>}
            </CardContent>
          </Card>
        )}

        {/* Buyer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Buyer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {foundBuyer ? (
              <div className="rounded-md border p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 text-sm">
                    <div className="border-b pb-2 mb-2 print:hidden">
                      <span className="text-muted-foreground">Code:</span>{" "}
                      <span className="font-medium">{foundBuyer.user_code}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Name:</span>{" "}
                      <span className="font-medium">{foundBuyer.display_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      <span className="font-medium">{foundBuyer.email}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFoundBuyer}
                    className="print:hidden shrink-0"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 print:hidden">
                  <Label htmlFor="buyerCode">Buyer Code</Label>
                  <div className="relative">
                    <Input
                      id="buyerCode"
                      value={buyerCode}
                      onChange={(e) => handleBuyerCodeSearch(e.target.value)}
                      placeholder="Enter buyer code (e.g. B250)"
                      className="print:border-none print:p-0 print:shadow-none"
                      autoComplete="off"
                    />
                    {buyerCodeSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {buyerCodeError && (
                    <p className="text-sm text-destructive">{buyerCodeError}</p>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyerName">Buyer Name</Label>
                    <div className="relative">
                      <Input
                        id="buyerName"
                        value={buyerName}
                        onChange={(e) => handleBuyerSearch(e.target.value)}
                        onBlur={() => {
                          if (buyerBlurTimerRef.current) clearTimeout(buyerBlurTimerRef.current)
                          buyerBlurTimerRef.current = setTimeout(() => {
                            setShowBuyerSuggestions(false)
                          }, 200)
                        }}
                        placeholder="Enter buyer name"
                        className="print:border-none print:p-0 print:shadow-none"
                        autoComplete="off"
                      />
                      {showBuyerSuggestions && buyerSuggestions.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto print:hidden">
                          {buyerSuggestions.map((buyer) => (
                            <button
                              key={buyer.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectBuyer(buyer)}
                            >
                              <span className="font-medium">{buyer.display_name}</span>
                              <span className="text-muted-foreground ml-2">— {buyer.email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Buyer Bank Information (Optional) - Collapsible */}
        <Card className={`print:hidden ${!showBuyerBankSection ? "border-dashed" : ""}`}>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setShowBuyerBankSection(!showBuyerBankSection)}
          >
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Buyer Bank Information (Optional)</span>
              {showBuyerBankSection ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
          {showBuyerBankSection && (
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buyerBankAccountName">Account Holder Name</Label>
                  <Input
                    id="buyerBankAccountName"
                    value={buyerBankInfo.account_name}
                    onChange={(e) => setBuyerBankInfo((prev) => ({ ...prev, account_name: e.target.value }))}
                    placeholder="Account holder name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerBankAccountNumber">Account Number</Label>
                  <Input
                    id="buyerBankAccountNumber"
                    value={buyerBankInfo.account_number}
                    onChange={(e) => setBuyerBankInfo((prev) => ({ ...prev, account_number: e.target.value }))}
                    placeholder="Account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerBankSwiftCode">SWIFT/BIC Code</Label>
                  <Input
                    id="buyerBankSwiftCode"
                    value={buyerBankInfo.swift_code}
                    onChange={(e) => setBuyerBankInfo((prev) => ({ ...prev, swift_code: e.target.value }))}
                    placeholder="SWIFT/BIC code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerBankName">Bank Name</Label>
                  <Input
                    id="buyerBankName"
                    value={buyerBankInfo.bank_name}
                    onChange={(e) => setBuyerBankInfo((prev) => ({ ...prev, bank_name: e.target.value }))}
                    placeholder="Bank name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerBankRegion">Bank Region</Label>
                  <Input
                    id="buyerBankRegion"
                    value={buyerBankInfo.bank_region}
                    onChange={(e) => setBuyerBankInfo((prev) => ({ ...prev, bank_region: e.target.value }))}
                    placeholder="Bank region"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerBankCode">Bank Code</Label>
                  <Input
                    id="buyerBankCode"
                    value={buyerBankInfo.bank_code}
                    onChange={(e) => setBuyerBankInfo((prev) => ({ ...prev, bank_code: e.target.value }))}
                    placeholder="Bank code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerBankBranchCode">Branch Code</Label>
                  <Input
                    id="buyerBankBranchCode"
                    value={buyerBankInfo.branch_code}
                    onChange={(e) => setBuyerBankInfo((prev) => ({ ...prev, branch_code: e.target.value }))}
                    placeholder="Branch code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerBankAddress">Bank Address</Label>
                  <Input
                    id="buyerBankAddress"
                    value={buyerBankInfo.bank_address}
                    onChange={(e) => setBuyerBankInfo((prev) => ({ ...prev, bank_address: e.target.value }))}
                    placeholder="Bank address"
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Print-only: Buyer Bank Information (TT) - only if fields filled */}
        {hasBuyerBankInfo(buyerBankInfo) && (
          <div className="hidden print:block" style={{ marginTop: "16px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>Buyer Bank Information (TT)</h3>
            <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
              {buyerBankInfo.account_name && <p><strong>Account Holder:</strong> {buyerBankInfo.account_name}</p>}
              {buyerBankInfo.account_number && <p><strong>Account Number:</strong> {buyerBankInfo.account_number}</p>}
              {buyerBankInfo.swift_code && <p><strong>SWIFT/BIC Code:</strong> {buyerBankInfo.swift_code}</p>}
              {buyerBankInfo.bank_name && <p><strong>Bank Name:</strong> {buyerBankInfo.bank_name}</p>}
              {buyerBankInfo.bank_region && <p><strong>Bank Region:</strong> {buyerBankInfo.bank_region}</p>}
              {buyerBankInfo.bank_code && <p><strong>Bank Code:</strong> {buyerBankInfo.bank_code}</p>}
              {buyerBankInfo.branch_code && <p><strong>Branch Code:</strong> {buyerBankInfo.branch_code}</p>}
              {buyerBankInfo.bank_address && <p><strong>Bank Address:</strong> {buyerBankInfo.bank_address}</p>}
            </div>
          </div>
        )}

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
                          {row.productName && (
                            <span className="ml-1 font-sans">{row.productName}</span>
                          )}
                        </span>
                        <Input
                          value={row.searchQuery}
                          onChange={(e) => handleProductSearch(i, e.target.value)}
                          onBlur={() => {
                            if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
                            blurTimerRef.current = setTimeout(() => {
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
                                <span className="text-muted-foreground ml-2">
                                  ({formatCurrency(product.price_per_meter)})
                                </span>
                              </button>
                            ))}
                          </div>
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
                          updateRow(i, "quantity", Math.max(1, parseInt(e.target.value, 10) || 1))
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
        <Card className="invoice-summary-card">
          <CardHeader className="print:hidden">
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
                className="w-28 text-right print:hidden"
              />
              {/* Print shows discount in parentheses per accounting convention */}
              <span className="hidden print:inline">({formatCurrency(discount)})</span>
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
                className="w-28 text-right text-green-600 print:hidden"
              />
              <span className="hidden print:inline">{formatCurrency(amountPaid)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold text-lg invoice-amount-due">
              <span>Amount Due</span>
              <span>{formatCurrency(amountDue)}</span>
            </div>
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
        <button
          type="button"
          className="whatsapp-btn"
          onClick={handleWhatsApp}
          disabled={!savedInvoiceId}
          title="Send via WhatsApp"
        >
          <span className="whatsapp-svgContainer">
            <svg
              viewBox="0 0 448 512"
              height="1.6em"
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5.1-3.9-10.6-6.6z" />
            </svg>
          </span>
          <span className="whatsapp-BG" />
        </button>
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
