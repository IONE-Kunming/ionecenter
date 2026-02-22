"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { Save, Trash2, Upload, Download, Search, FileSpreadsheet } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { updateProduct, deleteProduct, bulkImportProducts } from "@/lib/actions/products"

interface ProductRow {
  id: string
  name: string
  model_number: string
  price_per_meter: number
  stock: number
}

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
  const csv = "name,model_number,description,main_category,category,price_per_meter,stock,image_path\nExample Product,EX-001,Sample description,Aluminum Profiles,Window & Door Profiles,10.00,100,/images/example.jpg"
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "product-import-template.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export function SellerBulkEditList({ initialProducts }: { initialProducts: ProductRow[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [search, setSearch] = useState("")
  const [importResult, setImportResult] = useState<string | null>(null)
  const [importIsError, setImportIsError] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.model_number.toLowerCase().includes(search.toLowerCase())
  )

  const updateField = (id: string, field: string, value: string) => {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, [field]: field === "price_per_meter" || field === "stock" ? Number(value) : value } : p))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const product of products) {
        await updateProduct(product.id, {
          name: product.name,
          model_number: product.model_number,
          price_per_meter: product.price_per_meter,
          stock: product.stock,
        })
      }
      setImportIsError(false)
      setImportResult("All changes saved successfully!")
      router.refresh()
    } catch {
      setImportIsError(true)
      setImportResult("Failed to save changes.")
    }
    setSaving(false)
    setTimeout(() => setImportResult(null), 3000)
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      router.refresh()
    })
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
        main_category: r.main_category || "Aluminum Profiles",
        category: r.category || "",
        price_per_meter: Number(r.price_per_meter) || 0,
        stock: Number(r.stock) || 0,
        description: r.description || undefined,
      }))
      const result = await bulkImportProducts(mapped)
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowImportModal(true)} className="gap-2">
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>

      {importResult && !showImportModal && (
        <div className={`p-3 rounded-lg text-sm ${importIsError ? "bg-destructive/10 text-destructive" : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"}`}>
          {importResult}
        </div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Model #</TableHead>
              <TableHead>Price/m ($)</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState icon={Search} title="No products found" description="Try adjusting your search." className="py-8" />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell><Input value={product.name} onChange={(e) => updateField(product.id, "name", e.target.value)} className="h-8" /></TableCell>
                  <TableCell><Input value={product.model_number} onChange={(e) => updateField(product.id, "model_number", e.target.value)} className="h-8 w-32" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={product.price_per_meter} onChange={(e) => updateField(product.id, "price_per_meter", e.target.value)} className="h-8 w-24" /></TableCell>
                  <TableCell><Input type="number" value={product.stock} onChange={(e) => updateField(product.id, "stock", e.target.value)} className="h-8 w-24" /></TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(product.id)} disabled={isPending}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Import CSV Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Import Products from CSV</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file to bulk import products. The CSV should include the following columns:
            </p>
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-3">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Required CSV Columns</span>
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
              <Label>Upload CSV File</Label>
              <Input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} />
            </div>

            {importResult && showImportModal && (
              <div className={`p-3 rounded-lg text-sm ${importIsError ? "bg-destructive/10 text-destructive" : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"}`}>
                {importResult}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" /> Download Sample CSV
            </Button>
            <Button variant="outline" onClick={() => setShowImportModal(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
