"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Globe, Loader2, Save, Printer } from "lucide-react"
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

/* ── Stamp/Seal SVG component ── */
function SealStamp() {
  return (
    <svg viewBox="0 0 120 120" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="56" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="60" cy="60" r="48" fill="none" stroke="#fff" strokeWidth="1.5" />
      <path d="M60 14 A46 46 0 1 1 59.99 14" fill="none" id="stampCircle" />
      <text fontSize="8" fontWeight="bold" fill="#fff" letterSpacing="2">
        <textPath href="#stampCircle" startOffset="5%">OFFICIAL CONTRACT</textPath>
      </text>
      <text fontSize="8" fontWeight="bold" fill="#fff" letterSpacing="2">
        <textPath href="#stampCircle" startOffset="55%">IONE CENTER</textPath>
      </text>
      <line x1="30" y1="52" x2="90" y2="52" stroke="#fff" strokeWidth="1" />
      <text x="60" y="65" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff" letterSpacing="1">VERIFIED</text>
      <line x1="30" y1="70" x2="90" y2="70" stroke="#fff" strokeWidth="1" />
      <text x="60" y="82" textAnchor="middle" fontSize="7" fill="#fff">✦ AUTHORIZED ✦</text>
    </svg>
  )
}

/* ── Local contract translations ── */
type ContractLocale = "en" | "ar" | "zh"

const contractTranslations: Record<ContractLocale, Record<string, string>> = {
  en: {
    contract: "CONTRACT",
    contractNumber: "Contract #",
    contractDate: "Contract Date",
    expiryDate: "Expiry Date",
    sellerInformation: "Seller Information",
    buyerInformation: "Buyer Information",
    name: "Name",
    company: "Company",
    email: "Email",
    termsAndConditions: "Terms & Conditions",
    sellerSignature: "Seller Signature",
    buyerSignature: "Buyer Signature",
    year: "Year",
    month: "Month",
    day: "Day",
    electronicSignatures: "Electronic Signatures",
    clearSignature: "Clear",
    signHere: "Sign here",
    save: "Save",
    cancel: "Cancel",
    printContract: "Print Contract",
    backToContracts: "Back to Contracts",
    searchBuyer: "Search Buyer",
    searchPlaceholder: "Search by name, email or code...",
    contractCreated: "Contract created successfully",
    defaultTerms:
      "This contract is entered into by the Seller and the Buyer under the following terms and conditions:\n\n1. The Seller agrees to deliver goods/services as described in the linked invoice.\n2. Payment shall be made according to the agreed terms.\n3. Both parties agree to resolve disputes amicably.\n4. This contract is governed by applicable trade laws.",
  },
  ar: {
    contract: "عقد",
    contractNumber: "رقم العقد",
    contractDate: "تاريخ العقد",
    expiryDate: "تاريخ الانتهاء",
    sellerInformation: "معلومات البائع",
    buyerInformation: "معلومات المشتري",
    name: "الاسم",
    company: "الشركة",
    email: "البريد الإلكتروني",
    termsAndConditions: "الشروط والأحكام",
    sellerSignature: "توقيع البائع",
    buyerSignature: "توقيع المشتري",
    year: "السنة",
    month: "الشهر",
    day: "اليوم",
    electronicSignatures: "التوقيعات الإلكترونية",
    clearSignature: "مسح",
    signHere: "وقّع هنا",
    save: "حفظ",
    cancel: "إلغاء",
    printContract: "طباعة العقد",
    backToContracts: "العودة إلى العقود",
    searchBuyer: "البحث عن المشتري",
    searchPlaceholder: "البحث بالاسم أو البريد أو الرمز...",
    contractCreated: "تم إنشاء العقد بنجاح",
    defaultTerms:
      "يتم إبرام هذا العقد بين البائع والمشتري وفقاً للشروط والأحكام التالية:\n\n1. يوافق البائع على تسليم البضائع/الخدمات كما هو موصوف في الفاتورة المرتبطة.\n2. يتم الدفع وفقاً للشروط المتفق عليها.\n3. يوافق الطرفان على حل النزاعات ودياً.\n4. يخضع هذا العقد للقوانين التجارية المعمول بها.",
  },
  zh: {
    contract: "合同",
    contractNumber: "合同编号",
    contractDate: "合同日期",
    expiryDate: "到期日期",
    sellerInformation: "卖方信息",
    buyerInformation: "买方信息",
    name: "姓名",
    company: "公司",
    email: "电子邮件",
    termsAndConditions: "条款和条件",
    sellerSignature: "卖方签名",
    buyerSignature: "买方签名",
    year: "年",
    month: "月",
    day: "日",
    electronicSignatures: "电子签名",
    clearSignature: "清除",
    signHere: "在此签名",
    save: "保存",
    cancel: "取消",
    printContract: "打印合同",
    backToContracts: "返回合同列表",
    searchBuyer: "搜索买方",
    searchPlaceholder: "按姓名、邮箱或代码搜索...",
    contractCreated: "合同创建成功",
    defaultTerms:
      "本合同由卖方和买方在以下条款和条件下签订：\n\n1. 卖方同意按照关联发票中描述的内容交付货物/服务。\n2. 付款应按照约定条款进行。\n3. 双方同意友好协商解决争议。\n4. 本合同受适用贸易法律管辖。",
  },
}

export function CreateContractForm() {
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
  // Contract language selector
  const [contractLocale, setContractLocale] = useState<ContractLocale>("en")
  const ct = (key: string): string => contractTranslations[contractLocale]?.[key] ?? key
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
      setTerms(contractTranslations.en.defaultTerms)
    }
    loadData()
  }, [])

  // Update terms when contract locale changes (only if terms match a default)
  useEffect(() => {
    setTerms((prev) => {
      const allDefaults = Object.values(contractTranslations).map((tr) => tr.defaultTerms)
      if (allDefaults.includes(prev) || prev === "") {
        return contractTranslations[contractLocale].defaultTerms
      }
      return prev
    })
  }, [contractLocale])

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
        addToast("success", ct("contractCreated"))
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
          <ArrowLeft className="h-4 w-4" /> {ct("backToContracts")}
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
          <Printer className="h-4 w-4 mr-2" /> {ct("printContract")}
        </Button>
      </div>

      <div className="contract-print-area" dir={contractLocale === "ar" ? "rtl" : "ltr"}>
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
              <span className="cnt-header-title">{ct("contract")}</span>
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
              <span className="cnt-date-label">{ct("year")}</span>
              <span className="cnt-date-value">{dateParts.year}</span>
            </div>
            <div className="cnt-date-box">
              <span className="cnt-date-label">{ct("month")}</span>
              <span className="cnt-date-value">{dateParts.month}</span>
            </div>
            <div className="cnt-date-box">
              <span className="cnt-date-label">{ct("day")}</span>
              <span className="cnt-date-value">{dateParts.day}</span>
            </div>
          </div>
          <div className="cnt-contract-no">
            <span className="cnt-contract-no-label">{ct("contractNumber")}</span>
            <span className="cnt-contract-no-value">{contractNumber}</span>
          </div>
        </div>

        {/* ═══════ Form Fields ═══════ */}
        <Card className="border-0 shadow-none">
          <CardContent className="space-y-6 pt-6">
            {/* Contract Number, Date, Expiry */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{ct("contractNumber")}</Label>
                <Input value={contractNumber} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>{ct("contractDate")}</Label>
                <Input type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} />
              </div>
              <div>
                <Label>{ct("expiryDate")}</Label>
                <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>
            </div>

            {/* Seller Information (auto-filled, read only) */}
            <div>
              <h3 className="text-sm font-semibold mb-2">{ct("sellerInformation")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>{ct("name")}</Label>
                  <Input value={sellerName} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>{ct("company")}</Label>
                  <Input value={sellerCompany} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>{ct("email")}</Label>
                  <Input value={sellerEmail} readOnly className="bg-muted" />
                </div>
              </div>
            </div>

            {/* Buyer Information (editable) */}
            <div>
              <h3 className="text-sm font-semibold mb-2">{ct("buyerInformation")}</h3>
              <div className="mb-3 relative" ref={buyerDropdownRef}>
                <Label>{ct("searchBuyer")}</Label>
                <Input
                  value={buyerSearch}
                  onChange={(e) => handleBuyerSearch(e.target.value)}
                  placeholder={ct("searchPlaceholder")}
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
                  <Label>{ct("name")}</Label>
                  <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
                </div>
                <div>
                  <Label>{ct("company")}</Label>
                  <Input value={buyerCompany} onChange={(e) => setBuyerCompany(e.target.value)} />
                </div>
                <div>
                  <Label>{ct("email")}</Label>
                  <Input value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div>
              <Label>{ct("termsAndConditions")}</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[200px]"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              />
            </div>

            {/* Electronic Signatures */}
            <div>
              <h3 className="text-sm font-semibold mb-4">{ct("electronicSignatures")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seller Signature */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>{ct("sellerSignature")}</Label>
                    <Button variant="ghost" size="sm" onClick={() => clearCanvas(sellerCanvasRef)} className="print:hidden">
                      {ct("clearSignature")}
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
                      {ct("signHere")}
                    </span>
                  </div>
                </div>

                {/* Buyer Signature */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>{ct("buyerSignature")}</Label>
                    <Button variant="ghost" size="sm" onClick={() => clearCanvas(buyerCanvasRef)} className="print:hidden">
                      {ct("clearSignature")}
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
                      {ct("signHere")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit — hidden when printing */}
            <div className="flex justify-end gap-3 print:hidden">
              <Link href="/seller/contracts">
                <Button variant="outline">{ct("cancel")}</Button>
              </Link>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {ct("save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Language selector — hidden when printing */}
      <div className="flex items-center justify-center gap-2 mt-6 print:hidden">
        <Globe className="h-5 w-5 text-muted-foreground" />
        <select
          value={contractLocale}
          onChange={(e) => setContractLocale(e.target.value as ContractLocale)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="en">English</option>
          <option value="ar">عربي (Arabic)</option>
          <option value="zh">中文 (Chinese)</option>
        </select>
      </div>
    </div>
  )
}
