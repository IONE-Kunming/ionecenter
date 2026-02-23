"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Package, Plus, Search, Upload, Download, Pencil, Trash2, FileSpreadsheet } from "lucide-react"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, getStockStatus } from "@/lib/utils"
import { MAIN_CATEGORIES, getSubcategories } from "@/types/categories"
import { bulkImportProducts, uploadProductImage } from "@/lib/actions/products"
import { ImportPreview } from "@/components/bulk-edit/import-preview"
import type { ImportRow } from "@/components/bulk-edit/bulk-edit-table"
import type { Product } from "@/types/database"

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ""
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === "," && !inQuotes) { values.push(current.trim()); current = ""; continue }
    current += ch
  }
  values.push(current.trim())
  return values
}

function parseCSV(text: string): Record<string, string>[] {
  // Remove BOM if present
  const cleaned = text.replace(/^\ufeff/, "")
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"))
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? "" })
    return row
  })
}

function downloadTemplate() {
  const csv = "name,model_number,description,main_category,category,price_per_meter,stock,image_path\nExample Product,EX-001,Sample description,Construction,Exterior Gates,10.00,100,/images/example.jpg"
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "product-import-template.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export function SellerProductsList({ initialProducts }: { initialProducts: Product[] }) {
  const t = useTranslations("sellerProducts")
  const tCommon = useTranslations("common")
  const tBulk = useTranslations("bulkEdit")
  const [products] = useState(initialProducts)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [importIsError, setImportIsError] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<ImportRow[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFile(file)
    setImportResult(null)
    setImportIsError(false)
  }

  const handleAnalyzePreview = async () => {
    if (!importFile) return
    try {
      const text = await importFile.text()
      const rows = parseCSV(text)
      if (rows.length === 0) {
        setImportIsError(true)
        setImportResult(t("noValidRowsCsv"))
        return
      }
      const mapped: ImportRow[] = rows.map((r) => ({
        name: r.name || r.product_name || "Unnamed Product",
        model_number: r.model_number || "",
        main_category: r.main_category || r.category_main || "",
        category: r.category || r.subcategory || r.sub_category || "",
        price_per_meter: Number(r.price_per_meter || r.price) || 0,
        stock: Number(r.stock || r.quantity) || 0,
        description: r.description || undefined,
        image_url: r.image_url || r.image_path || undefined,
      }))
      setPreviewRows(mapped)
      setShowImportModal(false)
      setShowPreview(true)
    } catch {
      setImportIsError(true)
      setImportResult(t("failedParseCsv"))
    }
  }

  const handleFinishImport = async (rows: ImportRow[], imageFiles: (File | null)[]) => {
    setImporting(true)
    try {
      const finalRows = [...rows]
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]
        if (file) {
          const formData = new FormData()
          formData.append("file", file)
          const result = await uploadProductImage(formData)
          if (result.url) {
            finalRows[i] = { ...finalRows[i], image_url: result.url }
          }
        }
      }
      const result = await bulkImportProducts(finalRows)
      if (result.error) {
        setImporting(false)
        return
      }
      setShowPreview(false)
      setPreviewRows([])
      setImportFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      router.refresh()
    } catch {
      // error handled
    }
    setImporting(false)
  }

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.model_number.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || p.main_category === categoryFilter
    return matchSearch && matchCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tCommon("searchProducts")} className="pl-9" />
        </div>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} options={MAIN_CATEGORIES.map((c) => ({ value: c, label: c }))} placeholder={tCommon("allCategories")} className="w-full sm:w-56" />
        <Button onClick={() => setShowAddModal(true)} className="gap-2"><Plus className="h-4 w-4" /> {t("addProduct")}</Button>
        <Button variant="outline" onClick={() => setShowImportModal(true)} className="gap-2"><Upload className="h-4 w-4" /> {tBulk("bulkImport")}</Button>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const stockInfo = getStockStatus(product.stock)
            return (
              <Card key={product.id} className="group">
                <CardContent className="p-0">
                  <div className="aspect-square relative bg-gradient-to-br from-muted to-muted/50 rounded-t-xl flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="p-4">
                    <Badge variant="secondary" className="text-xs mb-2">{product.category}</Badge>
                    <h3 className="font-semibold text-sm">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.model_number}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-primary text-sm">{formatCurrency(product.price_per_meter)}/m</span>
                      <Badge variant={stockInfo.color === "green" ? "success" : stockInfo.color === "yellow" ? "warning" : "destructive"} className="text-xs">
                        {stockInfo.label} ({product.stock})
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1 gap-1"><Pencil className="h-3 w-3" /> {tCommon("edit")}</Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={Package} title={t("noProducts")} action={{ label: t("addProduct"), onClick: () => setShowAddModal(true) }} />
      )}

      {/* Add Product Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("addProduct")}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("productName")}</Label><Input placeholder={t("productNamePlaceholder")} /></div>
              <div className="space-y-2"><Label>{t("modelNumber")}</Label><Input placeholder={t("modelNumberPlaceholder")} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("mainCategory")}</Label>
                <Select options={MAIN_CATEGORIES.map((c) => ({ value: c, label: c }))} placeholder={t("selectCategory")} onChange={(e) => setSelectedCategory(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("subcategory")}</Label>
                <Select options={getSubcategories(selectedCategory).map((c) => ({ value: c, label: c }))} placeholder={t("selectSubcategory")} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("pricePerMeter")}</Label><Input type="number" step="0.01" placeholder="0.00" /></div>
              <div className="space-y-2"><Label>{t("stock")}</Label><Input type="number" placeholder="0" /></div>
            </div>
            <div className="space-y-2"><Label>{t("description")}</Label><Textarea placeholder={t("descriptionPlaceholder")} rows={3} /></div>
            <div className="space-y-2"><Label>{t("productImage")}</Label><Input type="file" accept="image/*" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>{tCommon("cancel")}</Button>
            <Button onClick={() => setShowAddModal(false)}>{t("addProduct")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{tBulk("importTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              {tBulk("importDescription")}
            </p>
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-3">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{tBulk("requiredColumns")}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">{t("productNameCol")}</span><span className="font-mono text-xs">name</span>
                <span className="text-muted-foreground">{t("modelNumberCol")}</span><span className="font-mono text-xs">model_number</span>
                <span className="text-muted-foreground">{t("descriptionCol")}</span><span className="font-mono text-xs">description</span>
                <span className="text-muted-foreground">{t("categoryCol")}</span><span className="font-mono text-xs">main_category</span>
                <span className="text-muted-foreground">{t("subCategoryCol")}</span><span className="font-mono text-xs">category</span>
                <span className="text-muted-foreground">{t("priceCol")}</span><span className="font-mono text-xs">price_per_meter</span>
                <span className="text-muted-foreground">{t("stockCol")}</span><span className="font-mono text-xs">stock</span>
                <span className="text-muted-foreground">{t("imagePathCol")}</span><span className="font-mono text-xs">image_path</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{tBulk("uploadCsvFile")}</Label>
              <Input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} disabled={importing} />
              {importFile && !importing && (
                <p className="text-sm text-muted-foreground">Selected: {importFile.name}</p>
              )}
              {importing && <p className="text-sm text-muted-foreground">{tBulk("importingProducts")}</p>}
            </div>

            {importResult && showImportModal && (
              <div className={`p-3 rounded-lg text-sm ${importIsError ? "bg-destructive/10 text-destructive" : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"}`}>
                {importResult}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" /> {tBulk("downloadSampleCsv")}
            </Button>
            <Button variant="outline" onClick={() => { setShowImportModal(false); setImportFile(null) }}>{tCommon("cancel")}</Button>
            <Button onClick={handleAnalyzePreview} disabled={!importFile} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> {t("analyzePreview")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Preview Modal */}
      <ImportPreview
        open={showPreview}
        onClose={() => { setShowPreview(false); setPreviewRows([]) }}
        initialRows={previewRows}
        onFinishImport={handleFinishImport}
        importing={importing}
      />
    </div>
  )
}
