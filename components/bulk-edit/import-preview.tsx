"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Upload, X, ImagePlus, Trash2, FileSpreadsheet } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { MAIN_CATEGORIES, getSubcategories } from "@/types/categories"
import type { ImportRow } from "./bulk-edit-table"

interface PreviewRow extends ImportRow {
  imageFile: File | null
  imagePreview: string | null
}

interface ImportPreviewProps {
  open: boolean
  onClose: () => void
  initialRows: ImportRow[]
  onFinishImport: (rows: ImportRow[], imageFiles: (File | null)[]) => Promise<void>
  importing: boolean
}

export function ImportPreview({ open, onClose, initialRows, onFinishImport, importing }: ImportPreviewProps) {
  const [rows, setRows] = useState<PreviewRow[]>([])
  const fileRefs = useRef<(HTMLInputElement | null)[]>([])

  // Re-initialize rows when initialRows change (e.g., new CSV parsed)
  useEffect(() => {
    if (initialRows.length > 0) {
      setRows(initialRows.map((r) => ({ ...r, imageFile: null, imagePreview: null })))
    }
  }, [initialRows])

  const updateRow = useCallback((index: number, field: keyof ImportRow, value: string | number) => {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }, [])

  const updateMainCategory = useCallback((index: number, value: string) => {
    setRows((prev) => prev.map((r, i) => {
      if (i !== index) return r
      const subs = getSubcategories(value)
      return { ...r, main_category: value, category: subs[0] ?? "" }
    }))
  }, [])

  const removeRow = useCallback((index: number) => {
    setRows((prev) => {
      const row = prev[index]
      if (row.imagePreview) URL.revokeObjectURL(row.imagePreview)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const handleImageSelect = useCallback((index: number, file: File) => {
    setRows((prev) => prev.map((r, i) => {
      if (i !== index) return r
      if (r.imagePreview) URL.revokeObjectURL(r.imagePreview)
      return { ...r, imageFile: file, imagePreview: URL.createObjectURL(file) }
    }))
  }, [])

  const handleFinish = async () => {
    const importRows: ImportRow[] = rows.map((r) => ({
      name: r.name,
      model_number: r.model_number,
      main_category: r.main_category,
      category: r.category,
      price_per_meter: r.price_per_meter,
      stock: r.stock,
      description: r.description,
      image_url: r.image_url,
    }))
    const imageFiles = rows.map((r) => r.imageFile)
    await onFinishImport(importRows, imageFiles)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-[95vw] w-full max-h-[90vh] flex flex-col p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Import Preview</h2>
              <p className="text-xs text-muted-foreground">{rows.length} products ready to import — Review and edit before importing</p>
            </div>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {rows.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-sm">No products to import. All rows have been removed.</p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="border-b bg-muted/80 backdrop-blur-sm">
                  <th className="px-3 py-2.5 text-left text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground w-10">#</th>
                  <th className="px-3 py-2.5 text-left text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground min-w-[160px]">Name</th>
                  <th className="px-3 py-2.5 text-left text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground min-w-[120px]">Model #</th>
                  <th className="px-3 py-2.5 text-left text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground min-w-[180px]">Category</th>
                  <th className="px-3 py-2.5 text-left text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground min-w-[180px]">Subcategory</th>
                  <th className="px-3 py-2.5 text-left text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground min-w-[100px]">Price</th>
                  <th className="px-3 py-2.5 text-left text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground min-w-[80px]">Stock</th>
                  <th className="px-3 py-2.5 text-left text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground min-w-[200px]">Description</th>
                  <th className="px-3 py-2.5 text-left text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground min-w-[100px]">Image</th>
                  <th className="px-3 py-2.5 text-left text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 text-xs text-muted-foreground text-center">{idx + 1}</td>

                    {/* Name */}
                    <td className="px-3 py-1.5">
                      <Input
                        value={row.name}
                        onChange={(e) => updateRow(idx, "name", e.target.value)}
                        className="h-8 text-xs"
                        placeholder="Product name"
                      />
                    </td>

                    {/* Model # */}
                    <td className="px-3 py-1.5">
                      <Input
                        value={row.model_number}
                        onChange={(e) => updateRow(idx, "model_number", e.target.value)}
                        className="h-8 text-xs"
                        placeholder="Model #"
                      />
                    </td>

                    {/* Main Category */}
                    <td className="px-3 py-1.5">
                      <Select
                        value={row.main_category}
                        onChange={(e) => updateMainCategory(idx, e.target.value)}
                        options={MAIN_CATEGORIES.map((c) => ({ value: c, label: c }))}
                        placeholder="Select category"
                        className="h-8 text-xs"
                      />
                    </td>

                    {/* Subcategory */}
                    <td className="px-3 py-1.5">
                      <Select
                        value={row.category}
                        onChange={(e) => updateRow(idx, "category", e.target.value)}
                        options={getSubcategories(row.main_category).map((c) => ({ value: c, label: c }))}
                        placeholder="Select subcategory"
                        className="h-8 text-xs"
                      />
                    </td>

                    {/* Price */}
                    <td className="px-3 py-1.5">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.price_per_meter}
                          onChange={(e) => updateRow(idx, "price_per_meter", Number(e.target.value))}
                          className="h-8 text-xs pl-5"
                        />
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="px-3 py-1.5">
                      <Input
                        type="number"
                        min="0"
                        value={row.stock}
                        onChange={(e) => updateRow(idx, "stock", Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </td>

                    {/* Description */}
                    <td className="px-3 py-1.5">
                      <Input
                        value={row.description ?? ""}
                        onChange={(e) => updateRow(idx, "description", e.target.value)}
                        className="h-8 text-xs"
                        placeholder="Description"
                      />
                    </td>

                    {/* Image */}
                    <td className="px-3 py-1.5">
                      <input
                        ref={(el) => { fileRefs.current[idx] = el }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageSelect(idx, file)
                        }}
                      />
                      {row.imagePreview ? (
                        <div className="relative h-10 w-10 rounded border overflow-hidden group">
                          <img src={row.imagePreview} alt="" className="h-full w-full object-cover" />
                          <button
                            onClick={() => {
                              setRows((prev) => prev.map((r, i) => {
                                if (i !== idx) return r
                                if (r.imagePreview) URL.revokeObjectURL(r.imagePreview)
                                return { ...r, imageFile: null, imagePreview: null }
                              }))
                            }}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileRefs.current[idx]?.click()}
                          className="h-10 w-10 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                        >
                          <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                    </td>

                    {/* Remove */}
                    <td className="px-3 py-1.5">
                      <button
                        onClick={() => removeRow(idx)}
                        className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-card">
          <p className="text-sm text-muted-foreground">{rows.length} products</p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} disabled={importing}>Cancel</Button>
            <Button onClick={handleFinish} disabled={rows.length === 0 || importing} className="gap-2">
              <Upload className="h-4 w-4" />
              {importing ? "Importing..." : "Finish Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
