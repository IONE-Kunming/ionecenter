"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save, Printer } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toaster"
import Link from "@/components/ui/link"
import Image from "next/image"
import { createContract, getNextContractNumber } from "@/lib/actions/contracts"
import { getSellerBankInfo, searchBuyers } from "@/lib/actions/invoices"

interface BuyerResult {
  id: string
  display_name: string
  email: string
  user_code: string | null
  company: string | null
}

/* ── Simple Code128B barcode SVG generator ── */
function generateBarcodeSVG(text: string): string {
  const CODE128B_START = 104
  const CODE128_STOP = 106
  const PATTERNS: number[][] = [
    [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
    [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
    [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
    [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
    [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
    [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
    [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
    [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
    [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],
    [1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],
    [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],
    [3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],
    [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],
    [1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],
    [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],
    [2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],
    [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],
    [1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],
    [2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],
    [1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],
    [1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],[2,1,1,4,1,2],[2,1,1,2,1,4],
    [2,1,1,2,3,2],[2,3,3,1,1,1,2],
  ]

  const codes: number[] = [CODE128B_START]
  let checksum = CODE128B_START
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32
    codes.push(code)
    checksum += code * (i + 1)
  }
  codes.push(checksum % 103)
  codes.push(CODE128_STOP)

  let bars = ""
  let x = 10
  const barHeight = 50
  for (const code of codes) {
    const pattern = PATTERNS[code]
    for (let j = 0; j < pattern.length; j++) {
      const w = pattern[j]
      if (j % 2 === 0) {
        bars += `<rect x="${x}" y="0" width="${w}" height="${barHeight}" fill="#000"/>`
      }
      x += w
    }
  }
  const totalWidth = x + 10
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${barHeight + 14}" width="${totalWidth}" height="${barHeight + 14}">
    <rect width="${totalWidth}" height="${barHeight + 14}" fill="white"/>
    ${bars}
    <text x="${totalWidth / 2}" y="${barHeight + 12}" text-anchor="middle" font-size="10" font-family="monospace" fill="#000">${text}</text>
  </svg>`
}

/* ── Stamp/Seal SVG component (notary-style) ── */
function SealStamp() {
  /* Scalloped/gear outer ring – 24 teeth */
  const teeth = 24
  const cx = 60, cy = 60
  const outerR = 56, innerR = 50
  let scallopPath = ""
  for (let i = 0; i < teeth; i++) {
    const a1 = (Math.PI * 2 * i) / teeth
    const a2 = (Math.PI * 2 * (i + 0.5)) / teeth
    const x1 = cx + outerR * Math.cos(a1)
    const y1 = cy + outerR * Math.sin(a1)
    const x2 = cx + innerR * Math.cos(a2)
    const y2 = cy + innerR * Math.sin(a2)
    scallopPath += i === 0 ? `M${x1.toFixed(2)},${y1.toFixed(2)}` : `L${x1.toFixed(2)},${y1.toFixed(2)}`
    scallopPath += `L${x2.toFixed(2)},${y2.toFixed(2)}`
  }
  scallopPath += "Z"

  const color = "#2a7a8a"

  return (
    <svg viewBox="0 0 120 120" width="90" height="90" xmlns="http://www.w3.org/2000/svg">
      {/* Scalloped outer ring */}
      <path d={scallopPath} fill="none" stroke={color} strokeWidth="2" />
      {/* Two concentric circles */}
      <circle cx="60" cy="60" r="46" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="60" cy="60" r="40" fill="none" stroke={color} strokeWidth="1.2" />

      {/* Curved text paths */}
      <defs>
        <path id="stampTopArc" d="M20,60 A40,40 0 1,1 100,60" fill="none" />
        <path id="stampBottomArc" d="M96,68 A38,38 0 1,1 24,68" fill="none" />
      </defs>

      {/* "IONE CENTER" along the top */}
      <text fontSize="9" fontWeight="bold" fill={color} letterSpacing="3">
        <textPath href="#stampTopArc" startOffset="50%" textAnchor="middle">IONE CENTER</textPath>
      </text>

      {/* "CERTIFIED" along the bottom */}
      <text fontSize="8.5" fontWeight="bold" fill={color} letterSpacing="2.5">
        <textPath href="#stampBottomArc" startOffset="50%" textAnchor="middle">CERTIFIED</textPath>
      </text>

      {/* Horizontal lines with gap for "IONE" text in center */}
      <line x1="22" y1="60" x2="42" y2="60" stroke={color} strokeWidth="1.2" />
      <line x1="78" y1="60" x2="98" y2="60" stroke={color} strokeWidth="1.2" />
      <text x="60" y="64" textAnchor="middle" fontSize="14" fontWeight="900" fill={color} fontFamily="Arial, sans-serif">IONE</text>
    </svg>
  )
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
  const [buyerName, setBuyerName] = useState("")
  const [buyerCompany, setBuyerCompany] = useState("")
  const [buyerEmail, setBuyerEmail] = useState("")
  const [terms, setTerms] = useState("")
  // Seller info
  const [sellerName, setSellerName] = useState("")
  const [sellerCompany, setSellerCompany] = useState("")
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

  // Parse date parts for header display
  const dateParts = useMemo(() => {
    if (!contractDate) return { year: "—", month: "—", day: "—" }
    const d = new Date(contractDate + "T00:00:00")
    return {
      year: String(d.getFullYear()),
      month: String(d.getMonth() + 1).padStart(2, "0"),
      day: String(d.getDate()).padStart(2, "0"),
    }
  }, [contractDate])

  // Generate barcode SVG from contract number
  const barcodeSVG = useMemo(() => {
    if (!contractNumber) return ""
    return generateBarcodeSVG(contractNumber)
  }, [contractNumber])

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const [nextNumber, sellerInfo] = await Promise.all([
        getNextContractNumber(),
        getSellerBankInfo(),
      ])
      setContractNumber(nextNumber)
      if (sellerInfo) {
        setSellerName(sellerInfo.display_name || "")
        setSellerCompany(sellerInfo.company || "")
        setSellerEmail(sellerInfo.email || "")
      }

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
    setBuyerName(buyer.display_name)
    setBuyerCompany(buyer.company || "")
    setBuyerEmail(buyer.email)
    setBuyerSearch("")
    setShowBuyerDropdown(false)
  }

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
      {/* Back link — hidden when printing */}
      <div className="print:hidden flex items-center justify-between">
        <Link href="/seller/contracts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("backToContracts")}
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
          <Printer className="h-4 w-4 mr-2" /> {t("printContract")}
        </Button>
      </div>

      <div className="contract-print-area">
        {/* ═══════ Professional Header ═══════ */}
        <div className="cnt-header">
          <div className="cnt-header-inner">
            {/* Left: Black side with logo */}
            <div className="cnt-header-left">
              <Image src="/logo.svg" alt="IONE" width={100} height={33} className="cnt-header-logo" />
            </div>
            {/* Center: Seal/stamp */}
            <div className="cnt-header-seal">
              <SealStamp />
            </div>
            {/* Right: Red side with CONTRACT title */}
            <div className="cnt-header-right">
              <span className="cnt-header-title">CONTRACT</span>
            </div>
            {/* Far right: Barcode */}
            <div className="cnt-header-barcode">
              {barcodeSVG && (
                <div dangerouslySetInnerHTML={{ __html: barcodeSVG }} />
              )}
            </div>
          </div>
        </div>

        {/* ═══════ Second row: Date boxes + Contract No. ═══════ */}
        <div className="cnt-date-row">
          <div className="cnt-date-boxes">
            <div className="cnt-date-box">
              <span className="cnt-date-label">{t("year")}</span>
              <span className="cnt-date-value">{dateParts.year}</span>
            </div>
            <div className="cnt-date-box">
              <span className="cnt-date-label">{t("month")}</span>
              <span className="cnt-date-value">{dateParts.month}</span>
            </div>
            <div className="cnt-date-box">
              <span className="cnt-date-label">{t("day")}</span>
              <span className="cnt-date-value">{dateParts.day}</span>
            </div>
          </div>
          <div className="cnt-contract-no">
            <span className="cnt-contract-no-label">{t("contractNumber")}</span>
            <span className="cnt-contract-no-value">{contractNumber}</span>
          </div>
        </div>

        {/* ═══════ Form Fields ═══════ */}
        <Card className="border-0 shadow-none">
          <CardContent className="space-y-6 pt-6">
            {/* Contract Number, Date, Expiry */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{t("contractNumber")}</Label>
                <Input value={contractNumber} readOnly className="bg-muted" />
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

            {/* Seller Information (auto-filled, read only) */}
            <div>
              <h3 className="text-sm font-semibold mb-2">{t("sellerInformation")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>{t("sellerName")}</Label>
                  <Input value={sellerName} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>{t("companyName")}</Label>
                  <Input value={sellerCompany} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>{t("sellerEmail")}</Label>
                  <Input value={sellerEmail} readOnly className="bg-muted" />
                </div>
              </div>
            </div>

            {/* Buyer Information (editable) */}
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
                  <Label>{t("buyerName")}</Label>
                  <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
                </div>
                <div>
                  <Label>{t("companyName")}</Label>
                  <Input value={buyerCompany} onChange={(e) => setBuyerCompany(e.target.value)} />
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
                    <Button variant="ghost" size="sm" onClick={() => clearCanvas(sellerCanvasRef)} className="print:hidden">
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
                    <Button variant="ghost" size="sm" onClick={() => clearCanvas(buyerCanvasRef)} className="print:hidden">
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

            {/* Submit — hidden when printing */}
            <div className="flex justify-end gap-3 print:hidden">
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
    </div>
  )
}
