"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/toaster"
import Link from "@/components/ui/link"
import { createPackingList, getNextPackingListNumber } from "@/lib/actions/packing-lists"
import { getSellerBankInfo, searchBuyers, searchBuyerByCode, getSellerOfflineInvoicesForLinking } from "@/lib/actions/invoices"
import { searchProductsByModelNumber } from "@/lib/actions/products"

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

interface PackingItem {
  item_code: string
  product_name: string
  quantity: number
  unit: string
  h: number
  l: number
  w: number
  net_weight: number
  gross_weight: number
  carton_number: string
}

interface ProductResult {
  model_number: string
  name: string
}

const emptyItem: PackingItem = {
  item_code: "",
  product_name: "",
  quantity: 1,
  unit: "pcs",
  h: 0,
  l: 0,
  w: 0,
  net_weight: 0,
  gross_weight: 0,
  carton_number: "",
}

export function CreatePackingListForm() {
  const t = useTranslations("packingLists")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const { addToast } = useToast()

  const [loading, setLoading] = useState(false)
  const [packingListNumber, setPackingListNumber] = useState("")
  const [packingDate, setPackingDate] = useState(new Date().toISOString().split("T")[0])
  const [buyerCode, setBuyerCode] = useState("")
  const [buyerName, setBuyerName] = useState("")
  const [buyerEmail, setBuyerEmail] = useState("")
  const [invoiceId, setInvoiceId] = useState("")
  const [invoices, setInvoices] = useState<InvoiceOption[]>([])
  const [items, setItems] = useState<PackingItem[]>([{ ...emptyItem }])

  // Seller info
  const [sellerName, setSellerName] = useState("")
  const [sellerCode, setSellerCode] = useState("")
  const [sellerEmail, setSellerEmail] = useState("")

  // Buyer search
  const [buyerSearch, setBuyerSearch] = useState("")
  const [buyerResults, setBuyerResults] = useState<BuyerResult[]>([])
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false)
  const buyerDropdownRef = useRef<HTMLDivElement>(null)

  // Product code search
  const [productResults, setProductResults] = useState<Record<number, ProductResult[]>>({})
  const [activeProductDropdown, setActiveProductDropdown] = useState<number | null>(null)
  const productDropdownRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const productSearchTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  const handleItemCodeSearch = useCallback((index: number, query: string) => {
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], item_code: query }
      return updated
    })

    // Clear previous timer for this row
    if (productSearchTimers.current[index]) {
      clearTimeout(productSearchTimers.current[index])
    }

    if (query.length < 1) {
      setProductResults((prev) => ({ ...prev, [index]: [] }))
      setActiveProductDropdown(null)
      return
    }

    // Debounce the search
    productSearchTimers.current[index] = setTimeout(async () => {
      const results = await searchProductsByModelNumber(query)
      setProductResults((prev) => ({ ...prev, [index]: results }))
      setActiveProductDropdown(index)
    }, 300)
  }, [])

  const selectProduct = (index: number, product: ProductResult) => {
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], item_code: product.model_number, product_name: product.name }
      return updated
    })
    setProductResults((prev) => ({ ...prev, [index]: [] }))
    setActiveProductDropdown(null)
  }

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const [nextNumber, sellerInfo, invoiceList] = await Promise.all([
        getNextPackingListNumber(),
        getSellerBankInfo(),
        getSellerOfflineInvoicesForLinking(),
      ])
      setPackingListNumber(nextNumber)
      if (sellerInfo) {
        setSellerName(sellerInfo.display_name || "")
        setSellerCode(sellerInfo.user_code || "")
        setSellerEmail(sellerInfo.email || "")
      }
      setInvoices(invoiceList)
    }
    loadData()
  }, [])

  // Cleanup product search timers on unmount
  useEffect(() => {
    const timers = productSearchTimers.current
    return () => {
      Object.values(timers).forEach(clearTimeout)
    }
  }, [])

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
      // Close product dropdown if clicking outside
      if (activeProductDropdown !== null) {
        const ref = productDropdownRefs.current[activeProductDropdown]
        if (ref && !ref.contains(e.target as Node)) {
          setActiveProductDropdown(null)
        }
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [activeProductDropdown])

  // Item management
  const addItem = () => setItems([...items, { ...emptyItem }])

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof PackingItem, value: string | number) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  // Totals
  const totalPackages = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  const totalWeight = items.reduce((sum, item) => sum + ((Number(item.net_weight) || 0) * (Number(item.quantity) || 0)), 0)
  const totalGrossWeight = items.reduce((sum, item) => sum + (Number(item.gross_weight) || 0), 0)
  const totalCBM = items.reduce((sum, item) => {
    const cbm = (item.h && item.l && item.w) ? (item.h * item.l * item.w) / 1_000_000 : 0
    return sum + cbm * (Number(item.quantity) || 0)
  }, 0)

  const handleSubmit = async () => {
    if (!buyerName || !buyerEmail) {
      addToast("error", "Please fill in buyer information")
      return
    }
    if (items.length === 0 || !items[0].product_name) {
      addToast("error", "Please add at least one item")
      return
    }

    setLoading(true)
    try {
      const result = await createPackingList({
        packing_list_number: packingListNumber,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_code: buyerCode || undefined,
        invoice_id: invoiceId || undefined,
        date: packingDate,
        items: items.map((item) => ({
          item_code: item.item_code,
          product_name: item.product_name,
          quantity: Number(item.quantity) || 1,
          unit: item.unit,
          height: Number(item.h) || 0,
          length: Number(item.l) || 0,
          width: Number(item.w) || 0,
          net_weight: Number(item.net_weight) || 0,
          gross_weight: Number(item.gross_weight) || 0,
          carton_number: item.carton_number,
        })),
      })

      if (result.error) {
        addToast("error", result.error)
      } else {
        addToast("success", t("packingListCreated"))
        router.push("/seller/packing-lists")
      }
    } catch {
      addToast("error", "Failed to create packing list")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="print:hidden flex items-center justify-between">
        <Link href="/seller/packing-lists" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("backToPackingLists")}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("createPackingList")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Packing List Number and Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>{t("packingListNumber")}</Label>
              <Input value={packingListNumber} onChange={(e) => setPackingListNumber(e.target.value)} />
            </div>
            <div>
              <Label>{tCommon("date")}</Label>
              <Input type="date" value={packingDate} onChange={(e) => setPackingDate(e.target.value)} />
            </div>
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

          {/* Packing Items Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{t("packingItems")}</h3>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> {t("addItem")}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">NO</TableHead>
                    <TableHead className="min-w-[100px]">SKU</TableHead>
                    <TableHead className="min-w-[70px]">H</TableHead>
                    <TableHead className="min-w-[70px]">L</TableHead>
                    <TableHead className="min-w-[70px]">W</TableHead>
                    <TableHead className="min-w-[70px]">QTY</TableHead>
                    <TableHead className="min-w-[80px]">WEIGHT</TableHead>
                    <TableHead className="min-w-[90px]">TOTAL WEIGHT</TableHead>
                    <TableHead className="min-w-[90px]">GROSS WEIGHT</TableHead>
                    <TableHead className="min-w-[80px]">CBM</TableHead>
                    <TableHead className="min-w-[90px]">TOTAL CBM</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const cbm = (item.h && item.l && item.w) ? (item.h * item.l * item.w) / 1_000_000 : 0
                    const totalWeight = (Number(item.quantity) || 0) * (Number(item.net_weight) || 0)
                    const totalCbm = cbm * (Number(item.quantity) || 0)
                    return (
                    <TableRow key={index}>
                      <TableCell className="text-center font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="relative" ref={(el) => { productDropdownRefs.current[index] = el }}>
                          <Input
                            value={item.item_code}
                            onChange={(e) => handleItemCodeSearch(index, e.target.value)}
                            onFocus={() => {
                              if (item.item_code.length >= 1 && productResults[index]?.length) {
                                setActiveProductDropdown(index)
                              }
                            }}
                            className="min-w-[90px]"
                          />
                          {activeProductDropdown === index && (
                            <div className="absolute z-20 w-64 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                              {(productResults[index] ?? []).length > 0 ? (
                                productResults[index].map((p, pi) => (
                                  <button
                                    key={pi}
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                                    onClick={() => selectProduct(index, p)}
                                  >
                                    <span className="font-medium">{p.model_number}</span>
                                    <span className="text-muted-foreground ml-2">{p.name}</span>
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-muted-foreground">No products found</div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.1}
                          value={item.h || ""}
                          onChange={(e) => updateItem(index, "h", parseFloat(e.target.value) || 0)}
                          className="min-w-[60px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.1}
                          value={item.l || ""}
                          onChange={(e) => updateItem(index, "l", parseFloat(e.target.value) || 0)}
                          className="min-w-[60px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.1}
                          value={item.w || ""}
                          onChange={(e) => updateItem(index, "w", parseFloat(e.target.value) || 0)}
                          className="min-w-[60px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                          className="min-w-[60px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.net_weight || ""}
                          onChange={(e) => updateItem(index, "net_weight", parseFloat(e.target.value) || 0)}
                          className="min-w-[70px]"
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{totalWeight.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.gross_weight || ""}
                          onChange={(e) => updateItem(index, "gross_weight", parseFloat(e.target.value) || 0)}
                          className="min-w-[70px]"
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{cbm.toFixed(4)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{totalCbm.toFixed(4)}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={items.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Summary */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold mb-3">{t("summary")}</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t("totalPackages")}:</span>
                  <span className="ml-2 font-medium">{totalPackages}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Weight:</span>
                  <span className="ml-2 font-medium">{totalWeight.toFixed(2)} kg</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("totalGrossWeight")}:</span>
                  <span className="ml-2 font-medium">{totalGrossWeight.toFixed(2)} kg</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total CBM:</span>
                  <span className="ml-2 font-medium">{totalCBM.toFixed(4)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link href="/seller/packing-lists">
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
