"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toaster"
import Link from "@/components/ui/link"
import { createContract, getNextContractNumber, getSellerOfflineInvoicesForLinking } from "@/lib/actions/contracts"
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

  // Seller info
  const [sellerName, setSellerName] = useState("")
  const [sellerCode, setSellerCode] = useState("")
  const [sellerEmail, setSellerEmail] = useState("")

  // Buyer search
  const [buyerSearch, setBuyerSearch] = useState("")
  const [buyerResults, setBuyerResults] = useState<BuyerResult[]>([])
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false)
  const buyerDropdownRef = useRef<HTMLDivElement>(null)

  // Signature canvases
  const sellerCanvasRef = useRef<HTMLCanvasElement>(null)
  const buyerCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawingSeller, setIsDrawingSeller] = useState(false)
  const [isDrawingBuyer, setIsDrawingBuyer] = useState(false)

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const [nextNumber, sellerInfo, invoiceList] = await Promise.all([
        getNextContractNumber(),
        getSellerBankInfo(),
        getSellerOfflineInvoicesForLinking(),
      ])
      setContractNumber(nextNumber)
      if (sellerInfo) {
        setSellerName(sellerInfo.display_name || "")
        setSellerCode(sellerInfo.user_code || "")
        setSellerEmail(sellerInfo.email || "")
      }
      setInvoices(invoiceList)

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
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

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
