"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Upload, X, ImagePlus, Trash2, FileSpreadsheet, GripVertical } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { CategoryData } from "@/lib/categories"
import { getSubcategoriesFromData } from "@/lib/categories"
import { useExchangeRate, usdToCny, cnyToUsd } from "@/lib/use-exchange-rate"
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
  categoryData: CategoryData
}

type ColumnKey = "name" | "model_number" | "main_category" | "category" | "price_per_meter" | "price_usd" | "price_cny" | "stock" | "description" | "pricing_type" | "image"

interface ColumnDef {
  key: ColumnKey
  label: string
  minWidth: string
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name", minWidth: "min-w-[160px]" },
  { key: "model_number", label: "Model #", minWidth: "min-w-[120px]" },
  { key: "main_category", label: "Category", minWidth: "min-w-[180px]" },
  { key: "category", label: "Subcategory", minWidth: "min-w-[180px]" },
  { key: "price_per_meter", label: "Price/Meter", minWidth: "min-w-[120px]" },
  { key: "price_usd", label: "Price (USD $)", minWidth: "min-w-[120px]" },
  { key: "price_cny", label: "Price (CNY ¥)", minWidth: "min-w-[120px]" },
  { key: "stock", label: "Stock", minWidth: "min-w-[80px]" },
  { key: "pricing_type", label: "Pricing Type", minWidth: "min-w-[140px]" },
  { key: "description", label: "Description", minWidth: "min-w-[200px]" },
  { key: "image", label: "Image", minWidth: "min-w-[100px]" },
]

export function ImportPreview({ open, onClose, initialRows, onFinishImport, importing, categoryData }: ImportPreviewProps) {
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_COLUMNS)
  const [draggedCol, setDraggedCol] = useState<number | null>(null)
  const [dragOverCol, setDragOverCol] = useState<number | null>(null)
  const [draggedRow, setDraggedRow] = useState<number | null>(null)
  const [dragOverRow, setDragOverRow] = useState<number | null>(null)
  const fileRefs = useRef<(HTMLInputElement | null)[]>([])
  const { rate, isLive, loading: rateLoading } = useExchangeRate()

  // Re-initialize rows when initialRows change (e.g., new CSV parsed)
  // Auto-calculate missing USD/CNY prices using exchange rate
  useEffect(() => {
    if (initialRows.length > 0 && !rateLoading) {
      setRows(initialRows.map((r) => {
        let finalUsd = r.price_usd ?? (r.price_per_meter || 0)
        let finalCny = r.price_cny ?? null
        let finalPricePerMeter = r.price_per_meter || 0

        if (finalUsd > 0 && (!finalCny || finalCny === 0)) {
          finalCny = usdToCny(finalUsd, rate)
        } else if (finalCny && finalCny > 0 && finalUsd === 0) {
          finalUsd = cnyToUsd(finalCny, rate)
          finalPricePerMeter = finalUsd
        }

        return { ...r, price_per_meter: finalPricePerMeter, price_usd: finalUsd, price_cny: finalCny, imageFile: null, imagePreview: null }
      }))
      setColumns(DEFAULT_COLUMNS)
    }
  }, [initialRows, rate, rateLoading])

  const updateRow = useCallback((index: number, field: keyof ImportRow, value: string | number) => {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }, [])

  const updateMainCategory = useCallback((index: number, value: string) => {
    setRows((prev) => prev.map((r, i) => {
      if (i !== index) return r
      const subs = getSubcategoriesFromData(categoryData, value)
      // Keep the current subcategory if it's valid for the new main category
      const lowerCat = r.category.toLowerCase()
      const matched = subs.find((s) => s.toLowerCase() === lowerCat)
      return { ...r, main_category: value, category: matched ?? subs[0] ?? "" }
    }))
  }, [categoryData])

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
      return { ...r, imageFile: file, imagePreview: URL.createObjectURL(file), image_url: undefined }
    }))
  }, [])

  // ─── Column drag-and-drop ──────────────────────────────────────────────
  const handleDragStart = useCallback((colIndex: number) => {
    setDraggedCol(colIndex)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, colIndex: number) => {
    e.preventDefault()
    setDragOverCol(colIndex)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (draggedCol !== null && dragOverCol !== null && draggedCol !== dragOverCol) {
      setColumns((prev) => {
        const next = [...prev]
        const [moved] = next.splice(draggedCol, 1)
        next.splice(dragOverCol, 0, moved)
        return next
      })
    }
    setDraggedCol(null)
    setDragOverCol(null)
  }, [draggedCol, dragOverCol])

  // ─── Row drag-and-drop ────────────────────────────────────────────────
  const handleRowDragStart = useCallback((rowIndex: number) => {
    setDraggedRow(rowIndex)
  }, [])

  const handleRowDragOver = useCallback((e: React.DragEvent, rowIndex: number) => {
    e.preventDefault()
    setDragOverRow(rowIndex)
  }, [])

  const handleRowDragEnd = useCallback(() => {
    if (draggedRow !== null && dragOverRow !== null && draggedRow !== dragOverRow) {
      setRows((prev) => {
        const next = [...prev]
        const [moved] = next.splice(draggedRow, 1)
        next.splice(dragOverRow, 0, moved)
        return next
      })
    }
    setDraggedRow(null)
    setDragOverRow(null)
  }, [draggedRow, dragOverRow])

  // ─── Keyboard reordering (Alt+Arrow) ──────────────────────────────────
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return
      const active = document.activeElement as HTMLElement | null
      const row = active?.closest("tr")
      if (!row) return
      const rowIndex = Number(row.dataset.rowIndex)
      if (isNaN(rowIndex)) return

      if (e.key === "ArrowUp" && rowIndex > 0) {
        e.preventDefault()
        setRows((prev) => {
          const next = [...prev]
          ;[next[rowIndex - 1], next[rowIndex]] = [next[rowIndex], next[rowIndex - 1]]
          return next
        })
      } else if (e.key === "ArrowDown" && rowIndex < rows.length - 1) {
        e.preventDefault()
        setRows((prev) => {
          const next = [...prev]
          ;[next[rowIndex], next[rowIndex + 1]] = [next[rowIndex + 1], next[rowIndex]]
          return next
        })
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, rows.length])

  const handleFinish = async () => {
    const importRows: ImportRow[] = rows.map((r) => ({
      name: r.name,
      model_number: r.model_number,
      main_category: r.main_category,
      category: r.category,
      price_per_meter: r.price_per_meter,
      pricing_type: r.pricing_type,
      price_usd: r.price_usd,
      price_cny: r.price_cny,
      stock: r.stock,
      description: r.description,
      image_url: r.image_url,
    }))
    const imageFiles = rows.map((r) => r.imageFile)
    await onFinishImport(importRows, imageFiles)
  }

  // ─── Cell renderer ─────────────────────────────────────────────────────
  function renderCell(col: ColumnDef, row: PreviewRow, idx: number): React.ReactNode {
    switch (col.key) {
      case "name":
        return (
          <Input
            value={row.name}
            onChange={(e) => updateRow(idx, "name", e.target.value)}
            className="h-8 text-xs"
            placeholder="Product name"
          />
        )
      case "model_number":
        return (
          <Input
            value={row.model_number}
            onChange={(e) => updateRow(idx, "model_number", e.target.value)}
            className="h-8 text-xs"
            placeholder="Model #"
          />
        )
      case "main_category":
        return (
          <Select
            value={row.main_category}
            onChange={(e) => updateMainCategory(idx, e.target.value)}
            options={categoryData.mainCategories.map((c) => ({ value: c, label: c }))}
            placeholder="Select category"
            className="h-8 text-xs"
          />
        )
      case "category":
        return (
          <Select
            value={row.category}
            onChange={(e) => updateRow(idx, "category", e.target.value)}
            options={getSubcategoriesFromData(categoryData, row.main_category).map((c) => ({ value: c, label: c }))}
            placeholder="Select subcategory"
            className="h-8 text-xs"
          />
        )
      case "price_per_meter":
        return (
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={row.pricing_type === "customized" ? row.price_per_meter : ""}
              onChange={(e) => {
                const val = Number(e.target.value)
                setRows((prev) => prev.map((r, i) =>
                  i === idx ? { ...r, price_per_meter: val, price_usd: val, price_cny: val > 0 ? usdToCny(val, rate) : null, pricing_type: "customized" } : r
                ))
              }}
              className="h-8 text-xs pl-5"
              placeholder={row.pricing_type !== "customized" ? "—" : "0.00"}
            />
          </div>
        )
      case "price_usd":
        return (
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={row.price_usd ?? 0}
              onChange={(e) => {
                const usd = Number(e.target.value)
                setRows((prev) => prev.map((r, i) =>
                  i === idx ? { ...r, price_usd: usd, price_per_meter: usd, price_cny: usdToCny(usd, rate), pricing_type: "standard" } : r
                ))
              }}
              className="h-8 text-xs pl-5"
              placeholder="0.00"
            />
          </div>
        )
      case "price_cny":
        return (
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">¥</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={row.price_cny ?? 0}
              onChange={(e) => {
                const cny = Number(e.target.value)
                const usd = cnyToUsd(cny, rate)
                setRows((prev) => prev.map((r, i) =>
                  i === idx ? { ...r, price_cny: cny, price_usd: usd, price_per_meter: usd, pricing_type: "standard" } : r
                ))
              }}
              className="h-8 text-xs pl-5"
              placeholder="0.00"
            />
          </div>
        )
      case "stock":
        return (
          <Input
            type="number"
            min="0"
            value={row.stock}
            onChange={(e) => updateRow(idx, "stock", Number(e.target.value))}
            className="h-8 text-xs"
          />
        )
      case "pricing_type":
        return (
          <Select
            value={row.pricing_type || "standard"}
            onChange={(e) => updateRow(idx, "pricing_type", e.target.value)}
            options={[
              { value: "standard", label: "Standard" },
              { value: "customized", label: "Customized" },
            ]}
            className="h-8 text-xs"
          />
        )
      case "description":
        return (
          <Input
            value={row.description ?? ""}
            onChange={(e) => updateRow(idx, "description", e.target.value)}
            className="h-8 text-xs"
            placeholder="Description"
          />
        )
      case "image":
        return (
          <>
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
          </>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }} fullWidth>
      <DialogContent className="w-full max-h-[90vh] flex flex-col p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Import Preview</h2>
              <p className="text-xs text-muted-foreground">
                {rows.length} products ready to import — Drag column headers to reorder
                {" · "}
                <span className={isLive ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}>
                  Rate: $1 = ¥{rate.toFixed(2)} {isLive ? "(live)" : rateLoading ? "(loading…)" : "(fallback)"}
                </span>
              </p>
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
                  {columns.map((col, colIdx) => (
                    <th
                      key={col.key}
                      draggable
                      onDragStart={() => handleDragStart(colIdx)}
                      onDragOver={(e) => handleDragOver(e, colIdx)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "px-3 py-2.5 text-left text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground cursor-grab select-none",
                        col.minWidth,
                        draggedCol === colIdx && "opacity-50",
                        dragOverCol === colIdx && draggedCol !== colIdx && "border-l-2 border-l-primary"
                      )}
                    >
                      <span className="flex items-center gap-1">
                        <GripVertical className="h-3 w-3 opacity-40 shrink-0" />
                        {col.label}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-left text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    data-row-index={idx}
                    draggable
                    onDragStart={() => handleRowDragStart(idx)}
                    onDragOver={(e) => handleRowDragOver(e, idx)}
                    onDragEnd={handleRowDragEnd}
                    className={cn(
                      "border-b hover:bg-muted/30 transition-colors",
                      draggedRow === idx && "opacity-50",
                      dragOverRow === idx && draggedRow !== idx && "border-t-2 border-t-primary"
                    )}
                  >
                    <td className={cn("px-3 py-2 text-xs text-muted-foreground text-center", draggedRow === idx ? "cursor-grabbing" : "cursor-grab")}>
                      <span className="flex items-center gap-1 justify-center">
                        <GripVertical className="h-3 w-3 opacity-40 shrink-0" />
                        {idx + 1}
                      </span>
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-1.5">
                        {renderCell(col, row, idx)}
                      </td>
                    ))}
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
