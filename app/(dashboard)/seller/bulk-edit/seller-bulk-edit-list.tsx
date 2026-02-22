"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { Save, Trash2, Upload, Download, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
    const values = line.split(",").map((v) => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? "" })
    return row
  })
}

function downloadTemplate() {
  const csv = "name,model_number,main_category,category,price_per_meter,stock,description\nExample Product,EX-001,Aluminum Profiles,Window & Door Profiles,10.00,100,Sample description"
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
      setImportResult("All changes saved successfully!")
      router.refresh()
    } catch {
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
        setImportResult(`Import error: ${result.error}`)
      } else {
        setImportResult(`Successfully imported ${result.count} products!`)
        router.refresh()
      }
    } catch {
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
          <Button variant="outline" onClick={downloadTemplate} className="gap-2">
            <Download className="h-4 w-4" /> Download Template
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing} className="gap-2">
            <Upload className="h-4 w-4" /> {importing ? "Importing..." : "Import CSV"}
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>

      {importResult && (
        <div className={`p-3 rounded-lg text-sm ${importResult.startsWith("Error") || importResult.startsWith("Failed") || importResult.startsWith("Import error") || importResult.startsWith("No valid") ? "bg-destructive/10 text-destructive" : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"}`}>
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
    </div>
  )
}
