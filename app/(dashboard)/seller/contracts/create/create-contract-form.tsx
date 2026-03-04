"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save, Plus, Trash2, FileDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/toaster"
import Link from "@/components/ui/link"
import { createContract, getNextContractNumber, getSellerOfflineInvoicesForLinking, getSellerOfflineInvoicesForImport, getOfflineInvoiceItems } from "@/lib/actions/contracts"
import { getSellerBankInfo, searchBuyers, searchBuyerByCode } from "@/lib/actions/invoices"

interface BuyerResult {
  id: string
  display_name: string
  email: string
  user_code: string | null
}

interface InvoiceOption {
  id: string
  invoice_number: string
  buyer_name: string | null
  buyer_email: string | null
}

interface ImportInvoice {
  id: string
  invoice_number: string
  buyer_name: string | null
  buyer_email: string | null
  buyer_code: string | null
  total: number
  created_at: string
}

interface ContractItem {
  item_code: string
  product_name: string
  description: string
  quantity: number
  unit: string
  unit_price: number
}

const emptyItem: ContractItem = {
  item_code: "",
  product_name: "",
  description: "",
  quantity: 1,
  unit: "pcs",
  unit_price: 0,
}

export function CreateContractForm() {
  const t = useTranslations("contracts")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const { addToast } = useToast()

  const [loading, setLoading] = useState(false)
  const [contractNumber, setContractNumber] = useState("")
  const [contractDate, setContractDate] = useState(new Date().toISOString().split("T")[0])
  const [expiryDate, setExpiryDate] = useState("")
  const [buyerCode, setBuyerCode] = useState("")
  const [buyerName, setBuyerName] = useState("")
  const [buyerEmail, setBuyerEmail] = useState("")
  const [terms, setTerms] = useState("")
  const [invoiceId, setInvoiceId] = useState("")
  const [invoices, setInvoices] = useState<InvoiceOption[]>([])
  const [items, setItems] = useState<ContractItem[]>([{ ...emptyItem }])
  // Seller info
  const [sellerName, setSellerName] = useState("")
  const [sellerCode, setSellerCode] = useState("")
  const [sellerEmail, setSellerEmail] = useState("")

  // Buyer search
  const [buyerSearch, setBuyerSearch] = useState("")
  const [buyerResults, setBuyerResults] = useState<BuyerResult[]>([])
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false)
  const buyerDropdownRef = useRef<HTMLDivElement>(null)

  // Import from invoice
  const [importInvoices, setImportInvoices] = useState<ImportInvoice[]>([])
  const [showImportDropdown, setShowImportDropdown] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const importDropdownRef = useRef<HTMLDivElement>(null)

  // Signature canvases
  const sellerCanvasRef = useRef<HTMLCanvasElement>(null)
  const buyerCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawingSeller, setIsDrawingSeller] = useState(false)
  const [isDrawingBuyer, setIsDrawingBuyer] = useState(false)

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const [nextNumber, sellerInfo, invoiceList, importInvoiceList] = await Promise.all([
        getNextContractNumber(),
        getSellerBankInfo(),
        getSellerOfflineInvoicesForLinking(),
        getSellerOfflineInvoicesForImport(),
      ])
      setContractNumber(nextNumber)
      if (sellerInfo) {
        setSellerName(sellerInfo.display_name || "")
        setSellerCode(sellerInfo.user_code || "")
        setSellerEmail(sellerInfo.email || "")
      }
      setInvoices(invoiceList)
      setImportInvoices(importInvoiceList)

      // Set default terms
      setTerms(t("defaultTerms"))
    }
    loadData()
  }, [t])

  // Setup canvas for signatures
  useEffect(() => {
    const setupCanvas = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      canvas.width = canvas.offsetWidth * 2
      canvas.height = canvas.offsetHeight * 2
      ctx.scale(2, 2)
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
    }
    setupCanvas(sellerCanvasRef.current)
    setupCanvas(buyerCanvasRef.current)
  }, [])

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvasRef: React.RefObject<HTMLCanvasElement | null>, setDrawing: (v: boolean) => void) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const { x, y } = getCanvasCoords(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvasRef: React.RefObject<HTMLCanvasElement | null>, isDrawing: boolean) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const { x, y } = getCanvasCoords(e, canvas)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = (setDrawing: (v: boolean) => void) => {
    setDrawing(false)
  }

  const clearCanvas = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const getCanvasDataURL = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
    const canvas = canvasRef.current
    if (!canvas) return ""
    return canvas.toDataURL("image/png")
  }

  // Buyer search
  const handleBuyerSearch = useCallback(async (query: string) => {
    setBuyerSearch(query)
    if (query.length < 2) {
      setBuyerResults([])
      setShowBuyerDropdown(false)
      return
    }
    const results = await searchBuyers(query)
    setBuyerResults(results)
    setShowBuyerDropdown(results.length > 0)
  }, [])

  const selectBuyer = (buyer: BuyerResult) => {
    setBuyerCode(buyer.user_code || "")
    setBuyerName(buyer.display_name)
    setBuyerEmail(buyer.email)
    setBuyerSearch("")
    setShowBuyerDropdown(false)
  }

  // Buyer code lookup
  const handleBuyerCodeBlur = useCallback(async () => {
    if (!buyerCode) return
    const buyer = await searchBuyerByCode(buyerCode)
    if (buyer) {
      setBuyerName(buyer.display_name)
      setBuyerEmail(buyer.email)
    }
  }, [buyerCode])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (buyerDropdownRef.current && !buyerDropdownRef.current.contains(e.target as Node)) {
        setShowBuyerDropdown(false)
      }
      if (importDropdownRef.current && !importDropdownRef.current.contains(e.target as Node)) {
        setShowImportDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Import from invoice
  const handleImportFromInvoice = useCallback(async (invoice: ImportInvoice) => {
    setImportLoading(true)
    setShowImportDropdown(false)
    try {
      const invoiceItems = await getOfflineInvoiceItems(invoice.id)
      if (invoiceItems.length > 0) {
        const newItems: ContractItem[] = invoiceItems.map((item) => ({
          item_code: item.item_code || "",
          product_name: item.product_name || "",
          description: item.description || "",
          quantity: item.quantity,
          unit: "pcs",
          unit_price: item.unit_price,
        }))
        setItems(newItems)
      }
      // Auto-fill buyer info
      if (invoice.buyer_name) setBuyerName(invoice.buyer_name)
      if (invoice.buyer_email) setBuyerEmail(invoice.buyer_email)
      if (invoice.buyer_code) setBuyerCode(invoice.buyer_code)
      // Link the invoice
      setInvoiceId(invoice.id)
      addToast("success", t("invoiceImported"))
    } catch {
      addToast("error", t("importFailed"))
    } finally {
      setImportLoading(false)
    }
  }, [addToast, t])

  // Item management
  const addItem = () => setItems([...items, { ...emptyItem }])

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof ContractItem, value: string | number) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const handleSubmit = async () => {
    if (!buyerName || !buyerEmail) {
      addToast("error", "Please fill in buyer information")
      return
    }

    setLoading(true)
    try {
      const sellerSignature = getCanvasDataURL(sellerCanvasRef)
      const buyerSignature = getCanvasDataURL(buyerCanvasRef)

      const result = await createContract({
        contract_number: contractNumber,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_code: buyerCode || undefined,
        invoice_id: invoiceId || undefined,
        terms,
        seller_signature: sellerSignature || undefined,
        buyer_signature: buyerSignature || undefined,
        expiry_date: expiryDate || undefined,
        items: items.filter((item) => item.product_name).map((item) => ({
          ...item,
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
        })),
      })

      if (result.error) {
        addToast("error", result.error)
      } else {
        addToast("success", t("contractCreated"))
        router.push("/seller/contracts")
      }
    } catch {
      addToast("error", "Failed to create contract")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="print:hidden flex items-center justify-between">
        <Link href="/seller/contracts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("backToContracts")}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("createContract")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contract Number, Date, Expiry */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>{t("contractNumber")}</Label>
              <Input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} />
            </div>
            <div>
              <Label>{t("contractDate")}</Label>
              <Input type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} />
            </div>
            <div>
              <Label>{t("expiryDate")}</Label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
          </div>

          {/* Link to Invoice */}
          <div>
            <Label>{t("linkToInvoice")}</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
            >
              <option value="">{t("selectInvoice")}</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} — {inv.buyer_name || inv.buyer_email}
                </option>
              ))}
            </select>
          </div>

          {/* Seller Information (auto-filled) */}
          <div>
            <h3 className="text-sm font-semibold mb-2">{t("sellerInformation")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{t("sellerName")}</Label>
                <Input value={sellerName} disabled />
              </div>
              <div>
                <Label>{t("sellerCode")}</Label>
                <Input value={sellerCode} disabled />
              </div>
              <div>
                <Label>{t("sellerEmail")}</Label>
                <Input value={sellerEmail} disabled />
              </div>
            </div>
          </div>

          {/* Buyer Information */}
          <div>
            <h3 className="text-sm font-semibold mb-2">{t("buyerInformation")}</h3>
            <div className="mb-3 relative" ref={buyerDropdownRef}>
              <Label>Search Buyer</Label>
              <Input
                value={buyerSearch}
                onChange={(e) => handleBuyerSearch(e.target.value)}
                placeholder="Search by name, email or code..."
              />
              {showBuyerDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                  {buyerResults.map((b) => (
                    <button
                      key={b.id}
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                      onClick={() => selectBuyer(b)}
                    >
                      <span className="font-medium">{b.display_name}</span>
                      <span className="text-muted-foreground ml-2">{b.email}</span>
                      {b.user_code && <span className="text-muted-foreground ml-2">({b.user_code})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{t("buyerCode")}</Label>
                <Input value={buyerCode} onChange={(e) => setBuyerCode(e.target.value)} onBlur={handleBuyerCodeBlur} />
              </div>
              <div>
                <Label>{t("buyerName")}</Label>
                <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
              </div>
              <div>
                <Label>{t("buyerEmail")}</Label>
                <Input value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Contract Items Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("contractItems")}</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative" ref={importDropdownRef}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImportDropdown(!showImportDropdown)}
                    disabled={importLoading}
                  >
                    {importLoading ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4 mr-1" />
                    )}
                    {t("importFromInvoice")}
                  </Button>
                  {showImportDropdown && (
                    <div className="absolute right-0 z-20 mt-1 w-[400px] bg-background border rounded-md shadow-lg max-h-64 overflow-y-auto">
                      {importInvoices.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground">{t("noInvoicesFound")}</div>
                      ) : (
                        <>
                          <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                            {t("selectInvoiceToImport")}
                          </div>
                          {importInvoices.map((inv) => (
                            <button
                              key={inv.id}
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm hover:bg-accent cursor-pointer border-b last:border-b-0"
                              onClick={() => handleImportFromInvoice(inv)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{inv.invoice_number}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(inv.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-muted-foreground text-xs">
                                  {inv.buyer_name || inv.buyer_email || "—"}
                                </span>
                                <span className="text-xs font-medium">
                                  {inv.total.toFixed(2)}
                                </span>
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> {t("addItem")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[260px]">{t("item")}</TableHead>
                    <TableHead>{t("description")}</TableHead>
                    <TableHead className="text-right w-[120px]">{t("unitPrice")}</TableHead>
                    <TableHead className="text-right w-[90px]">{t("quantity")}</TableHead>
                    <TableHead className="text-right w-[120px]">{t("total")}</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <span className="text-xs text-muted-foreground font-mono">
                            {item.item_code || `RX${String(index + 1).padStart(3, "0")}`}
                          </span>
                          <Input
                            value={item.product_name}
                            onChange={(e) => updateItem(index, "product_name", e.target.value)}
                            placeholder={t("productName")}
                            className="mt-1 text-sm"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {item.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unit_price || ""}
                          onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                          className="w-24 ml-auto text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-20 ml-auto text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
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

          {/* Terms & Conditions */}
          <div>
            <Label>{t("termsAndConditions")}</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[200px]"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
            />
          </div>

          {/* Electronic Signatures */}
          <div>
            <h3 className="text-sm font-semibold mb-4">{t("electronicSignatures")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Seller Signature */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>{t("sellerSignature")}</Label>
                  <Button variant="ghost" size="sm" onClick={() => clearCanvas(sellerCanvasRef)}>
                    {t("clearSignature")}
                  </Button>
                </div>
                <div className="border rounded-md bg-white relative" style={{ height: "150px" }}>
                  <canvas
                    ref={sellerCanvasRef}
                    className="w-full h-full cursor-crosshair"
                    onMouseDown={(e) => startDrawing(e, sellerCanvasRef, setIsDrawingSeller)}
                    onMouseMove={(e) => draw(e, sellerCanvasRef, isDrawingSeller)}
                    onMouseUp={() => stopDrawing(setIsDrawingSeller)}
                    onMouseLeave={() => stopDrawing(setIsDrawingSeller)}
                    onTouchStart={(e) => startDrawing(e, sellerCanvasRef, setIsDrawingSeller)}
                    onTouchMove={(e) => draw(e, sellerCanvasRef, isDrawingSeller)}
                    onTouchEnd={() => stopDrawing(setIsDrawingSeller)}
                  />
                  <span className="absolute bottom-2 left-2 text-xs text-muted-foreground pointer-events-none">
                    {t("signHere")}
                  </span>
                </div>
              </div>

              {/* Buyer Signature */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>{t("buyerSignature")}</Label>
                  <Button variant="ghost" size="sm" onClick={() => clearCanvas(buyerCanvasRef)}>
                    {t("clearSignature")}
                  </Button>
                </div>
                <div className="border rounded-md bg-white relative" style={{ height: "150px" }}>
                  <canvas
                    ref={buyerCanvasRef}
                    className="w-full h-full cursor-crosshair"
                    onMouseDown={(e) => startDrawing(e, buyerCanvasRef, setIsDrawingBuyer)}
                    onMouseMove={(e) => draw(e, buyerCanvasRef, isDrawingBuyer)}
                    onMouseUp={() => stopDrawing(setIsDrawingBuyer)}
                    onMouseLeave={() => stopDrawing(setIsDrawingBuyer)}
                    onTouchStart={(e) => startDrawing(e, buyerCanvasRef, setIsDrawingBuyer)}
                    onTouchMove={(e) => draw(e, buyerCanvasRef, isDrawingBuyer)}
                    onTouchEnd={() => stopDrawing(setIsDrawingBuyer)}
                  />
                  <span className="absolute bottom-2 left-2 text-xs text-muted-foreground pointer-events-none">
                    {t("signHere")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link href="/seller/contracts">
              <Button variant="outline">{tCommon("cancel")}</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {tCommon("save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
