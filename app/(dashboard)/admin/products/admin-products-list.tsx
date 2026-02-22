"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Package, Search, Upload, Download, FileSpreadsheet, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import { MAIN_CATEGORIES } from "@/types/categories"
import { adminBulkImportProducts, adminDeleteProduct } from "@/lib/actions/admin"
import type { Product } from "@/types/database"

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n").filter((l) => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"))
  return lines.slice(1).map((line) => {
    const values: string[] = []
    let current = ""
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === "," && !inQuotes) { values.push(current.trim()); current = ""; continue }
      current += ch
    }
    values.push(current.trim())
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

export function AdminProductsList({ products }: { products: Product[] }) {
  const t = useTranslations("adminProducts")
  const tBulk = useTranslations("bulkEdit")
  const tCommon = useTranslations("common")

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [importIsError, setImportIsError] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.model_number.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || p.main_category === categoryFilter
    return matchSearch && matchCategory
  })

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setDeleteError(null)
    try {
      const result = await adminDeleteProduct(id)
      if (result.error) {
        setDeleteError(result.error)
      } else {
        router.refresh()
      }
    } catch {
      setDeleteError("Failed to delete product")
    }
    setDeletingId(null)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (rows.length === 0) {
        setImportIsError(true)
        setImportResult("No valid rows found in CSV.")
        setImporting(false)
        return
      }
      const mapped = rows.map((r) => ({
        name: r.name || "Unnamed Product",
        model_number: r.model_number || "",
        main_category: r.main_category || "",
        category: r.category || "",
        price_per_meter: Number(r.price_per_meter) || 0,
        stock: Number(r.stock) || 0,
        description: r.description || undefined,
      }))
      const result = await adminBulkImportProducts(mapped)
      if (result.error) {
        setImportIsError(true)
        setImportResult(`Import error: ${result.error}`)
      } else {
        setImportIsError(false)
        setImportResult(`Successfully imported ${result.count} products!`)
        setShowImportModal(false)
        router.refresh()
      }
    } catch {
      setImportIsError(true)
      setImportResult("Failed to import CSV file.")
    }
    setImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tCommon("searchProducts")} className="pl-9" />
        </div>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} options={MAIN_CATEGORIES.map((c) => ({ value: c, label: c }))} placeholder={tCommon("allCategories")} className="w-full sm:w-56" />
        <Button variant="outline" onClick={() => setShowImportModal(true)} className="gap-2">
          <Upload className="h-4 w-4" /> {tBulk("bulkImport")}
        </Button>
      </div>

      {importResult && !showImportModal && (
        <div className={`p-3 rounded-lg text-sm ${importIsError ? "bg-destructive/10 text-destructive" : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"}`}>
          {importResult}
        </div>
      )}

      {deleteError && (
        <div className="p-3 rounded-lg text-sm bg-destructive/10 text-destructive">{deleteError}</div>
      )}

      {filtered.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon("name")}</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>{t("category")}</TableHead>
                <TableHead>{t("seller")}</TableHead>
                <TableHead>{t("price")}</TableHead>
                <TableHead>{t("stock")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead>{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.model_number}</TableCell>
                  <TableCell><Badge variant="secondary">{product.category}</Badge></TableCell>
                  <TableCell>{product.seller_name ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(product.price_per_meter)}/m</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "success" : "destructive"}>
                      {product.is_active ? tCommon("active") : tCommon("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === product.id}
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState icon={Package} title={t("noProducts")} />
      )}

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
                <span className="text-muted-foreground">Product Name</span><span className="font-mono text-xs">name</span>
                <span className="text-muted-foreground">Model Number</span><span className="font-mono text-xs">model_number</span>
                <span className="text-muted-foreground">Description</span><span className="font-mono text-xs">description</span>
                <span className="text-muted-foreground">Category</span><span className="font-mono text-xs">main_category</span>
                <span className="text-muted-foreground">Sub Category</span><span className="font-mono text-xs">category</span>
                <span className="text-muted-foreground">Price</span><span className="font-mono text-xs">price_per_meter</span>
                <span className="text-muted-foreground">Stock</span><span className="font-mono text-xs">stock</span>
                <span className="text-muted-foreground">Image Path</span><span className="font-mono text-xs">image_path</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{tBulk("uploadCsvFile")}</Label>
              <Input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} disabled={importing} />
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
            <Button variant="outline" onClick={() => setShowImportModal(false)}>{tCommon("cancel")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
