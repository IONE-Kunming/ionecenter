"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import Image from "next/image"
import {
  Save, Upload, Download, Search, FileSpreadsheet,
  RotateCcw, Package, Trash2, GripVertical,
} from "lucide-react"
import { useTranslations } from "next-intl"
import readXlsxFile from "read-excel-file"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ImportPreview } from "./import-preview"
import { uploadProductImage } from "@/lib/actions/products"
import type { CategoryData } from "@/lib/categories"
import { getSubcategoriesFromData, isMainCategoryInData, getMainCategoryForSubcategoryInData } from "@/lib/categories"

// ─── Types ──────────────────────────────────────────────────────────────────
export interface BulkEditProduct {
  id: string
  name: string
  model_number: string
  price_usd: number
  price_cny?: number
  stock: number
  is_active: boolean
  image_url?: string | null
}

export type CurrencyMode = "usd" | "cny"

interface BulkEditTableProps {
  initialProducts: BulkEditProduct[]
  onSave: (products: BulkEditProduct[]) => Promise<{ error?: string; success?: boolean }>
  onDelete: (id: string) => Promise<{ error?: string; success?: boolean }>
  onImport: (rows: ImportRow[]) => Promise<{ error?: string; success?: boolean; count?: number }>
  title?: string
  subtitle?: string
  categoryData: CategoryData
}

export interface ImportRow {
  name: string
  model_number: string
  main_category: string
  category: string
  price_per_meter: number
  pricing_type?: string
  price_usd?: number | null
  price_cny?: number | null
  stock: number
  description?: string
  image_url?: string
}

type FilterMode = "all" | "available" | "unavailable" | "modified"

// ─── Column definitions for reorderable data columns ────────────────────────
type BulkEditColumnKey = "product" | "name" | "model_number" | "price" | "stock" | "availability"

interface BulkEditColumnDef {
  key: BulkEditColumnKey
  label: string
  hasTextInput: boolean
}

const DEFAULT_BULK_COLUMNS: BulkEditColumnDef[] = [
  { key: "product", label: "Product", hasTextInput: false },
  { key: "name", label: "Name", hasTextInput: true },
  { key: "model_number", label: "Model #", hasTextInput: true },
  { key: "price", label: "Price", hasTextInput: true },
  { key: "stock", label: "Stock", hasTextInput: true },
  { key: "availability", label: "Availability", hasTextInput: false },
]

// ─── CSV Parser ─────────────────────────────────────────────────────────────
function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s-]+/g, "_")
}

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
  const headers = parseCsvLine(lines[0]).map(normalizeHeader)
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? "" })
    return row
  })
}

async function parseExcelFile(file: File): Promise<Record<string, string>[]> {
  const rows = await readXlsxFile(file)
  if (rows.length < 2) return []
  const headers = rows[0].map((h) => normalizeHeader(String(h ?? "")))
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {}
    headers.forEach((h, i) => { record[h] = String(row[i] ?? "").trim() })
    return record
  })
}

function isExcelFile(file: File): boolean {
  const ext = file.name.toLowerCase()
  return ext.endsWith(".xlsx") || ext.endsWith(".xls")
}

function downloadTemplate() {
  const header = "name,model_number,description,main_category,category,price_usd,price_cny,stock,pricing_type"
  const row1 = "Steel Pipe A,SP-001,Measurement-based product,Construction,Exterior Gates,25.5,,200,Customized"
  const row2 = "LED Panel B,LP-002,Standard USD product,Electrical,Lighting,10,,100,Standard"
  const row3 = "Ceramic Tile C,CT-003,Standard CNY product,Construction,Tiles,,68,150,Standard"
  const csv = [header, row1, row2, row3].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "product-import-template.csv"
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Toast Component ────────────────────────────────────────────────────────
function Toast({ message, type, onDone }: { message: string; type: "success" | "error"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg animate-in slide-in-from-bottom-4 ${
      type === "success"
        ? "border-green-500/30 bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400"
        : "border-red-500/30 bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
    }`}>
      {message}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function BulkEditTable({
  initialProducts,
  onSave,
  onDelete,
  onImport,
  title = "Bulk Edit",
  subtitle = "PRODUCT MANAGEMENT — INLINE EDITOR",
  categoryData,
}: BulkEditTableProps) {
  const t = useTranslations("bulkEdit")
  const tCommon = useTranslations("common")

  const [products, setProducts] = useState<BulkEditProduct[]>(initialProducts)
  const [originalData] = useState<BulkEditProduct[]>(() => JSON.parse(JSON.stringify(initialProducts)))
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterMode>("all")
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [importIsError, setImportIsError] = useState(false)
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([])
  const [focusedCell, setFocusedCell] = useState({ row: -1, col: -1 })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [importFile, setImportFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<ImportRow[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("usd")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const toastCounter = useRef(0)

  // ─── Drag-and-drop reordering ───────────────────────────────────────────
  const [columnOrder, setColumnOrder] = useState<BulkEditColumnDef[]>(DEFAULT_BULK_COLUMNS)
  const [draggedCol, setDraggedCol] = useState<number | null>(null)
  const [dragOverCol, setDragOverCol] = useState<number | null>(null)
  const [draggedRow, setDraggedRow] = useState<number | null>(null)
  const [dragOverRow, setDragOverRow] = useState<number | null>(null)

  // ─── Filtering ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.model_number.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase())
      const matchesFilter = filter === "all" ||
        (filter === "available" && p.is_active) ||
        (filter === "unavailable" && !p.is_active) ||
        (filter === "modified" && modifiedIds.has(p.id))
      return matchesSearch && matchesFilter
    })
  }, [products, search, filter, modifiedIds])

  // ─── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: products.length,
    modified: modifiedIds.size,
    available: products.filter((p) => p.is_active).length,
    unavailable: products.filter((p) => !p.is_active).length,
  }), [products, modifiedIds])

  // ─── Toast helper ───────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = ++toastCounter.current
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ─── Field updates ─────────────────────────────────────────────────────
  const updateField = useCallback((id: string, field: keyof BulkEditProduct, value: string | number | boolean) => {
    setProducts((prev) => prev.map((p) => {
      if (p.id !== id) return p
      const updated = { ...p, [field]: value }
      return updated
    }))
    // Check if changed from original
    setModifiedIds((prev) => {
      const next = new Set(prev)
      const orig = originalData.find((o) => o.id === id)
      const current = products.find((p) => p.id === id)
      if (!orig || !current) return next

      const updatedProduct = { ...current, [field]: value }
      const changed =
        orig.name !== updatedProduct.name ||
        orig.model_number !== updatedProduct.model_number ||
        orig.price_usd !== updatedProduct.price_usd ||
        (orig.price_cny ?? 0) !== (updatedProduct.price_cny ?? 0) ||
        orig.stock !== updatedProduct.stock ||
        orig.is_active !== updatedProduct.is_active

      if (changed) next.add(id)
      else next.delete(id)
      return next
    })
  }, [originalData, products])

  // ─── Revert row ────────────────────────────────────────────────────────
  const revertRow = useCallback((id: string) => {
    const orig = originalData.find((o) => o.id === id)
    if (!orig) return
    setProducts((prev) => prev.map((p) => p.id === id ? { ...JSON.parse(JSON.stringify(orig)) } : p))
    setModifiedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    showToast("Row reverted")
  }, [originalData, showToast])

  // ─── Reset all ─────────────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    setProducts(JSON.parse(JSON.stringify(originalData)))
    setModifiedIds(new Set())
    showToast("All changes reset")
  }, [originalData, showToast])

  // ─── Save ──────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const result = await onSave(products)
      if (result.error) {
        showToast(`Error: ${result.error}`, "error")
      } else {
        showToast(`✓ ${products.length} products saved`)
        setModifiedIds(new Set())
        window.location.reload()
      }
    } catch {
      showToast("Failed to save changes", "error")
    }
    setSaving(false)
  }, [products, onSave, showToast])

  // ─── Import ────────────────────────────────────────────────────────────
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFile(file)
    setImportResult(null)
    setImportIsError(false)
  }, [])

  const handleAnalyzePreview = useCallback(async () => {
    if (!importFile) return
    try {
      let rows: Record<string, string>[]
      if (isExcelFile(importFile)) {
        rows = await parseExcelFile(importFile)
      } else {
        const text = await importFile.text()
        rows = parseCSV(text)
      }
      if (rows.length === 0) {
        setImportIsError(true)
        setImportResult("No valid rows found in the file.")
        return
      }
      const mapped: ImportRow[] = rows.map((r) => {
        // Smart category detection: try to figure out main_category and subcategory
        let mainCat = r.main_category || r.category_main || ""
        let subCat = r.category || r.subcategory || r.sub_category || ""

        // If mainCat is empty but subCat looks like a main category, swap them
        const mainCatMatch = !mainCat && subCat
          ? categoryData.mainCategories.find((c) => c.toLowerCase() === subCat.toLowerCase())
          : null
        if (mainCatMatch) {
          mainCat = mainCatMatch
          // Since r.category was used as main category, check other fields for actual subcategory
          subCat = r.sub_category || r.subcategory || ""
        }

        // If mainCat is not recognized but could be a subcategory, fix it
        if (mainCat && !isMainCategoryInData(categoryData, mainCat)) {
          const parent = getMainCategoryForSubcategoryInData(categoryData, mainCat)
          if (parent) {
            subCat = mainCat
            mainCat = parent
          } else {
            // Try case-insensitive match for main category
            const match = categoryData.mainCategories.find((c) => c.toLowerCase() === mainCat.toLowerCase())
            if (match) mainCat = match
          }
        }

        // If subCat is not in the subcategories of mainCat, try to find a match
        if (mainCat && subCat) {
          const subs = getSubcategoriesFromData(categoryData, mainCat)
          if (!subs.includes(subCat)) {
            // Case-insensitive match
            const match = subs.find((s) => s.toLowerCase() === subCat.toLowerCase())
            if (match) subCat = match
          }
        }

        // If no mainCat yet but subCat is a known subcategory, auto-detect parent
        if (!mainCat && subCat) {
          const parent = getMainCategoryForSubcategoryInData(categoryData, subCat)
          if (parent) mainCat = parent
        }

        // Determine pricing: price_per_meter → measurement-based, price_usd/price_cny → standard
        const rawPricePerMeter = Number(r.price_per_meter) || 0
        const rawPriceUsd = Number(r.price_usd) || 0
        const rawPriceCny = Number(r.price_cny) || 0

        const rawPricingType = (r.pricing_type || "").trim().toLowerCase()
        let pricingType: "standard" | "customized" = rawPricingType === "customized" ? "customized" : "standard"
        let pricePerMeter = 0
        let priceUsd: number | null = null
        let priceCny: number | null = null

        if (rawPricePerMeter > 0) {
          pricePerMeter = rawPricePerMeter
          priceUsd = rawPricePerMeter
        } else if (rawPriceUsd > 0) {
          pricePerMeter = rawPriceUsd
          priceUsd = rawPriceUsd
          // CNY will be auto-calculated in preview
        } else if (rawPriceCny > 0) {
          priceCny = rawPriceCny
          // USD will be auto-calculated in preview
        } else {
          pricePerMeter = Number(r.price) || 0
          priceUsd = pricePerMeter > 0 ? pricePerMeter : null
        }

        return {
          name: r.name || r.product_name || "Unnamed Product",
          model_number: r.model_number || "",
          main_category: mainCat,
          category: subCat,
          price_per_meter: pricePerMeter,
          pricing_type: pricingType,
          price_usd: priceUsd,
          price_cny: priceCny,
          stock: Number(r.stock || r.quantity) || 0,
          description: r.description || undefined,
          image_url: undefined,
        }
      })
      setPreviewRows(mapped)
      setShowImportModal(false)
      setShowPreview(true)
    } catch {
      setImportIsError(true)
      setImportResult("Failed to parse file. Please ensure it is a valid CSV or Excel file.")
    }
  }, [importFile])

  const handleFinishImport = useCallback(async (rows: ImportRow[], imageFiles: (File | null)[]) => {
    setImporting(true)
    try {
      // Upload images first
      const finalRows = [...rows]
      let uploadFailures = 0
      for (let i = 0; i < finalRows.length; i++) {
        const file = imageFiles[i]
        if (file) {
          try {
            const formData = new FormData()
            formData.append("file", file)
            const result = await uploadProductImage(formData)
            if (result.url) {
              finalRows[i] = { ...finalRows[i], image_url: result.url }
            } else {
              // Upload returned error — clear so it doesn't get saved
              finalRows[i] = { ...finalRows[i], image_url: undefined }
              uploadFailures++
            }
          } catch {
            // Individual image upload failed — continue with other images
            finalRows[i] = { ...finalRows[i], image_url: undefined }
            uploadFailures++
          }
        } else if (finalRows[i].image_url && !finalRows[i].image_url!.startsWith("http")) {
          // Clear local file paths that aren't valid server URLs
          finalRows[i] = { ...finalRows[i], image_url: undefined }
        }
      }

      const result = await onImport(finalRows)
      if (result.error) {
        showToast(`Import error: ${result.error}`, "error")
      } else {
        const msg = uploadFailures > 0
          ? `✓ ${result.count} products imported (${uploadFailures} image(s) failed to upload)`
          : `✓ ${result.count} products imported`
        showToast(msg, uploadFailures > 0 ? "error" : undefined)
        setShowPreview(false)
        setPreviewRows([])
        setImportFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        window.location.reload()
      }
    } catch {
      showToast("Failed to import products", "error")
    }
    setImporting(false)
  }, [onImport, showToast])

  // ─── Select all / Bulk delete ──────────────────────────────────────────
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === filtered.length) return new Set()
      return new Set(filtered.map((p) => p.id))
    })
  }, [filtered])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return
    setDeleting(true)
    try {
      let errorMsg = ""
      for (const id of selectedIds) {
        const result = await onDelete(id)
        if (result.error) { errorMsg = result.error; break }
      }
      if (errorMsg) {
        showToast(`Error: ${errorMsg}`, "error")
      } else {
        showToast(`✓ ${selectedIds.size} products deleted`)
        setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)))
        setSelectedIds(new Set())
        window.location.reload()
      }
    } catch {
      showToast("Failed to delete products", "error")
    }
    setDeleting(false)
  }, [selectedIds, onDelete, showToast])

  // ─── Row / Column reorder helpers ─────────────────────────────────────
  const moveRow = useCallback((fromFilteredIdx: number, toFilteredIdx: number) => {
    if (fromFilteredIdx < 0 || fromFilteredIdx >= filtered.length) return
    if (toFilteredIdx < 0 || toFilteredIdx >= filtered.length) return
    const src = filtered[fromFilteredIdx]
    const tgt = filtered[toFilteredIdx]
    setProducts((prev) => {
      const next = [...prev]
      const fi = next.findIndex((p) => p.id === src.id)
      const ti = next.findIndex((p) => p.id === tgt.id)
      if (fi >= 0 && ti >= 0) {
        const [moved] = next.splice(fi, 1)
        next.splice(ti, 0, moved)
      }
      return next
    })
  }, [filtered])

  const moveColumn = useCallback((fromIdx: number, toIdx: number) => {
    setColumnOrder((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next
    })
  }, [])

  // ─── Column drag-and-drop ─────────────────────────────────────────────
  const handleColDragStart = useCallback((colIndex: number) => {
    setDraggedCol(colIndex)
  }, [])

  const handleColDragOver = useCallback((e: React.DragEvent, colIndex: number) => {
    e.preventDefault()
    setDragOverCol(colIndex)
  }, [])

  const handleColDragEnd = useCallback(() => {
    if (draggedCol !== null && dragOverCol !== null && draggedCol !== dragOverCol) {
      moveColumn(draggedCol, dragOverCol)
    }
    setDraggedCol(null)
    setDragOverCol(null)
  }, [draggedCol, dragOverCol, moveColumn])

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
      moveRow(draggedRow, dragOverRow)
    }
    setDraggedRow(null)
    setDragOverRow(null)
  }, [draggedRow, dragOverRow, moveRow])

  // ─── Touch drag support for rows ──────────────────────────────────────
  const handleRowTouchStart = useCallback((rowIndex: number) => {
    setDraggedRow(rowIndex)
  }, [])

  const handleRowTouchMove = useCallback((e: React.TouchEvent) => {
    if (draggedRow === null) return
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const row = el?.closest("tr[data-row-index]") as HTMLElement | null
    if (row) {
      const idx = Number(row.dataset.rowIndex)
      if (!isNaN(idx)) setDragOverRow(idx)
    }
  }, [draggedRow])

  const handleRowTouchEnd = useCallback(() => {
    if (draggedRow !== null && dragOverRow !== null && draggedRow !== dragOverRow) {
      moveRow(draggedRow, dragOverRow)
    }
    setDraggedRow(null)
    setDragOverRow(null)
  }, [draggedRow, dragOverRow, moveRow])

  // ─── Touch drag support for columns ───────────────────────────────────
  const handleColTouchStart = useCallback((colIndex: number) => {
    setDraggedCol(colIndex)
  }, [])

  const handleColTouchMove = useCallback((e: React.TouchEvent) => {
    if (draggedCol === null) return
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const th = el?.closest("th[data-col-index]") as HTMLElement | null
    if (th) {
      const idx = Number(th.dataset.colIndex)
      if (!isNaN(idx)) setDragOverCol(idx)
    }
  }, [draggedCol])

  const handleColTouchEnd = useCallback(() => {
    if (draggedCol !== null && dragOverCol !== null && draggedCol !== dragOverCol) {
      moveColumn(draggedCol, dragOverCol)
    }
    setDraggedCol(null)
    setDragOverCol(null)
  }, [draggedCol, dragOverCol, moveColumn])

  // ─── Keyboard navigation ───────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null
      const inInput = active?.tagName === "INPUT" && (active as HTMLInputElement).type !== "checkbox" && active?.closest("td")
      const maxRow = filtered.length - 1
      const maxCol = columnOrder.length - 1

      // Alt+Arrow: reorder rows/columns
      if (e.altKey && focusedCell.row >= 0) {
        const { row, col } = focusedCell
        if (e.key === "ArrowUp" && row > 0) {
          e.preventDefault()
          moveRow(row, row - 1)
          setFocusedCell((prev) => ({ ...prev, row: prev.row - 1 }))
          return
        }
        if (e.key === "ArrowDown" && row < maxRow) {
          e.preventDefault()
          moveRow(row, row + 1)
          setFocusedCell((prev) => ({ ...prev, row: prev.row + 1 }))
          return
        }
        if (e.key === "ArrowLeft" && col > 0) {
          e.preventDefault()
          moveColumn(col, col - 1)
          setFocusedCell((prev) => ({ ...prev, col: prev.col - 1 }))
          return
        }
        if (e.key === "ArrowRight" && col < maxCol) {
          e.preventDefault()
          moveColumn(col, col + 1)
          setFocusedCell((prev) => ({ ...prev, col: prev.col + 1 }))
          return
        }
        return
      }

      if (focusedCell.row < 0 && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault()
        setFocusedCell({ row: 0, col: 0 })
        return
      }

      const { row, col } = focusedCell
      if (row < 0) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          if (row < maxRow) setFocusedCell({ row: row + 1, col })
          break
        case "ArrowUp":
          e.preventDefault()
          if (row > 0) setFocusedCell({ row: row - 1, col })
          break
        case "ArrowRight":
          if (inInput) {
            const inp = active as HTMLInputElement
            if (inp.type === "number" || inp.selectionStart === inp.value.length) {
              e.preventDefault()
              if (col < maxCol) setFocusedCell({ row, col: col + 1 })
            }
          } else {
            e.preventDefault()
            if (col < maxCol) setFocusedCell({ row, col: col + 1 })
          }
          break
        case "ArrowLeft":
          if (inInput) {
            const inp = active as HTMLInputElement
            if (inp.type === "number" || inp.selectionStart === 0) {
              e.preventDefault()
              if (col > 0) setFocusedCell({ row, col: col - 1 })
            }
          } else {
            e.preventDefault()
            if (col > 0) setFocusedCell({ row, col: col - 1 })
          }
          break
        case "Enter":
          e.preventDefault()
          if (row < maxRow) setFocusedCell({ row: row + 1, col })
          break
        case "Tab":
          e.preventDefault()
          if (e.shiftKey) {
            if (col > 0) setFocusedCell({ row, col: col - 1 })
            else if (row > 0) setFocusedCell({ row: row - 1, col: maxCol })
          } else {
            if (col < maxCol) setFocusedCell({ row, col: col + 1 })
            else if (row < maxRow) setFocusedCell({ row: row + 1, col: 0 })
          }
          break
        case "Escape":
          if (inInput) {
            ;(active as HTMLInputElement).blur()
            e.preventDefault()
          }
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [focusedCell, filtered.length, columnOrder.length, moveRow, moveColumn])

  // ─── Auto-focus cell ───────────────────────────────────────────────────
  useEffect(() => {
    if (focusedCell.row < 0 || !tableRef.current) return
    const td = tableRef.current.querySelector(`td[data-row="${focusedCell.row}"][data-col="${focusedCell.col}"]`) as HTMLElement | null
    if (!td) return

    // Remove old focus
    tableRef.current.querySelectorAll("td.ring-2").forEach((el) => el.classList.remove("ring-2", "ring-primary/50", "bg-primary/5"))
    td.classList.add("ring-2", "ring-primary/50", "bg-primary/5")

    if (columnOrder[focusedCell.col]?.hasTextInput) {
      const inp = td.querySelector("input:not([type=checkbox])") as HTMLInputElement | null
      if (inp) { inp.focus(); inp.select() }
    } else {
      const chk = td.querySelector("input[type=checkbox]") as HTMLInputElement | null
      if (chk) chk.focus()
      else td.focus()
    }
  }, [focusedCell, columnOrder])

  const filterBtns: { key: FilterMode; label: string }[] = [
    { key: "all", label: "All" },
    { key: "available", label: "Available" },
    { key: "unavailable", label: "Unavailable" },
    { key: "modified", label: "Modified" },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={deleting}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> {deleting ? "Deleting..." : `Delete (${selectedIds.size})`}
            </Button>
          )}
          {modifiedIds.size > 0 && (
            <div className="flex items-center gap-2 text-xs text-yellow-500">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
              Unsaved changes
            </div>
          )}
          <Button variant="outline" size="sm" onClick={resetAll}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || modifiedIds.size === 0}>
            <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? tCommon("saving") : t("saveAll")}
          </Button>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="flex gap-4 flex-wrap rounded-lg border bg-card p-2.5 text-[0.68rem] text-muted-foreground">
        <span className="flex items-center gap-1.5"><kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[0.6rem]">↑↓←→</kbd> Navigate</span>
        <span className="flex items-center gap-1.5"><kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[0.6rem]">Enter</kbd> Next row</span>
        <span className="flex items-center gap-1.5"><kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[0.6rem]">Esc</kbd> Exit edit</span>
        <span className="flex items-center gap-1.5"><kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[0.6rem]">Tab</kbd> Next cell</span>
        <span className="flex items-center gap-1.5"><kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[0.6rem]">Alt+↑↓</kbd> Reorder rows</span>
        <span className="flex items-center gap-1.5"><kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[0.6rem]">Alt+←→</kbd> Reorder columns</span>
      </div>

      {/* Stats */}
      <div className="flex gap-6 flex-wrap text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" /> Total: <strong className="text-foreground">{stats.total}</strong></span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-yellow-500" /> Modified: <strong className="text-foreground">{stats.modified}</strong></span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500" /> Available: <strong className="text-foreground">{stats.available}</strong></span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" /> Unavailable: <strong className="text-foreground">{stats.unavailable}</strong></span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 rounded-t-lg border border-b-0 bg-card p-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        {filterBtns.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)} className="ml-auto gap-1.5 text-xs h-8">
          <Upload className="h-3.5 w-3.5" /> Import
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrencyMode((prev) => (prev === "usd" ? "cny" : "usd"))}
          className="gap-1.5 text-xs h-8"
        >
          {currencyMode === "usd" ? "USD $" : "CN¥"}
        </Button>
        <span className="text-xs text-muted-foreground">{filtered.length} of {products.length}</span>
      </div>

      {/* Table */}
      <div className="rounded-b-lg border border-t-0 bg-card overflow-x-auto -mt-5">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No products match your filter</p>
          </div>
        ) : (
          <table ref={tableRef} className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded border-muted-foreground/50"
                  />
                </th>
                <th className="px-4 py-3 text-left text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground w-12">#</th>
                {columnOrder.map((col, colIdx) => (
                  <th
                    key={col.key}
                    data-col-index={colIdx}
                    draggable
                    onDragStart={() => handleColDragStart(colIdx)}
                    onDragOver={(e) => handleColDragOver(e, colIdx)}
                    onDragEnd={handleColDragEnd}
                    onTouchStart={() => handleColTouchStart(colIdx)}
                    onTouchMove={handleColTouchMove}
                    onTouchEnd={handleColTouchEnd}
                    className={cn(
                      "px-4 py-3 text-left text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground cursor-grab select-none touch-none",
                      draggedCol === colIdx && "opacity-50",
                      dragOverCol === colIdx && draggedCol !== colIdx && "border-l-2 border-l-primary"
                    )}
                    style={(col.key === "price" || col.key === "stock") ? { minWidth: 130 } : undefined}
                  >
                    <span className="flex items-center gap-1">
                      <GripVertical className="h-3 w-3 opacity-40 shrink-0" />
                      {col.label}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, rowIdx) => {
                const isModified = modifiedIds.has(product.id)
                return (
                  <tr
                    key={product.id}
                    data-row-index={rowIdx}
                    onDragOver={(e) => handleRowDragOver(e, rowIdx)}
                    className={cn(
                      "border-b transition-colors hover:bg-muted/30",
                      isModified && "border-l-2 border-l-yellow-500",
                      draggedRow === rowIdx && "opacity-50",
                      dragOverRow === rowIdx && draggedRow !== rowIdx && "border-t-2 border-t-primary"
                    )}
                  >
                    {/* Select checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="rounded border-muted-foreground/50"
                      />
                    </td>
                    {/* Row drag handle + Serial */}
                    <td
                      draggable
                      onDragStart={() => handleRowDragStart(rowIdx)}
                      onDragEnd={handleRowDragEnd}
                      className={cn("px-4 py-3 text-xs text-muted-foreground text-center touch-none", draggedRow === rowIdx ? "cursor-grabbing" : "cursor-grab")}
                      onTouchStart={() => handleRowTouchStart(rowIdx)}
                      onTouchMove={handleRowTouchMove}
                      onTouchEnd={handleRowTouchEnd}
                    >
                      <span className="flex items-center gap-1 justify-center">
                        <GripVertical className="h-3 w-3 opacity-40 shrink-0" />
                        {rowIdx + 1}
                      </span>
                    </td>
                    {/* Dynamic columns */}
                    {columnOrder.map((col, colIdx) => (
                      <td
                        key={col.key}
                        data-row={rowIdx}
                        data-col={colIdx}
                        onClick={() => setFocusedCell({ row: rowIdx, col: colIdx })}
                        tabIndex={-1}
                        className={col.key === "product" || col.key === "availability" ? "px-4 py-3" : "px-4 py-2 rounded-sm"}
                        style={(col.key === "price" || col.key === "stock") ? { minWidth: 130 } : undefined}
                      >
                        {col.key === "product" && (
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg border bg-muted/50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                              {product.image_url ? (
                                <Image src={product.image_url} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                              ) : (
                                <Package className="h-4 w-4 text-muted-foreground/40" />
                              )}
                            </div>
                            <span className="text-[0.68rem] text-muted-foreground font-mono bg-muted border rounded px-1.5 py-0.5 select-all">
                              {product.id.slice(0, 8)}…
                            </span>
                          </div>
                        )}
                        {col.key === "name" && (
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => updateField(product.id, "name", e.target.value)}
                            className="w-full min-w-[140px] bg-transparent border border-transparent rounded px-2 py-1.5 text-sm outline-none hover:border-border focus:border-primary focus:bg-muted/50 transition-colors"
                          />
                        )}
                        {col.key === "model_number" && (
                          <input
                            type="text"
                            value={product.model_number}
                            onChange={(e) => updateField(product.id, "model_number", e.target.value)}
                            className="w-full min-w-[100px] bg-transparent border border-transparent rounded px-2 py-1.5 text-sm outline-none hover:border-border focus:border-primary focus:bg-muted/50 transition-colors"
                          />
                        )}
                        {col.key === "price" && (
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              {currencyMode === "usd" ? "$" : "CN¥"}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={currencyMode === "usd" ? product.price_usd : (product.price_cny ?? "")}
                              onChange={(e) => updateField(product.id, currencyMode === "usd" ? "price_usd" : "price_cny", Number(e.target.value))}
                              className={cn(
                                "w-full max-w-[180px] bg-transparent border border-transparent rounded pr-2 py-1.5 text-sm outline-none hover:border-border focus:border-primary focus:bg-muted/50 transition-colors",
                                currencyMode === "usd" ? "pl-5" : "pl-9"
                              )}
                            />
                          </div>
                        )}
                        {col.key === "stock" && (
                          <input
                            type="number"
                            min="0"
                            value={product.stock}
                            onChange={(e) => updateField(product.id, "stock", Number(e.target.value))}
                            className="w-full max-w-[160px] bg-transparent border border-transparent rounded px-2 py-1.5 text-sm outline-none hover:border-border focus:border-primary focus:bg-muted/50 transition-colors"
                          />
                        )}
                        {col.key === "availability" && (
                          <div className="flex items-center gap-2.5 min-w-[130px]">
                            <label className="relative inline-flex cursor-pointer">
                              <input
                                type="checkbox"
                                checked={product.is_active}
                                onChange={(e) => updateField(product.id, "is_active", e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 rounded-full bg-muted border peer-checked:bg-green-500/20 peer-checked:border-green-500 transition-colors" />
                              <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-muted-foreground transition-transform peer-checked:translate-x-4 peer-checked:bg-green-500 peer-checked:shadow-[0_0_8px_rgba(74,222,128,0.4)]" />
                            </label>
                            <span className={`text-xs font-medium whitespace-nowrap ${product.is_active ? "text-green-500" : "text-red-500"}`}>
                              {product.is_active ? "In Stock" : "Out of Stock"}
                            </span>
                          </div>
                        )}
                      </td>
                    ))}
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => revertRow(product.id)}
                        className="text-xs text-muted-foreground hover:text-primary border border-transparent hover:border-border rounded px-2 py-1 transition-colors"
                      >
                        ↩ Revert
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onDone={() => removeToast(toast.id)} />
        ))}
      </div>

      {/* Bulk Import Modal */}
      <Dialog open={showImportModal} onOpenChange={(v) => {
        setShowImportModal(v)
        if (!v) {
          setImportFile(null)
          setImportResult(null)
          setImportIsError(false)
          if (fileInputRef.current) fileInputRef.current.value = ""
        }
      }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("importTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">{t("importDescription")}</p>
            <div className="rounded-lg border p-4 bg-muted/50 max-h-[200px] overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t("requiredColumns")}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">Product Name</span><span className="font-mono text-xs">name</span>
                <span className="text-muted-foreground">Model Number</span><span className="font-mono text-xs">model_number</span>
                <span className="text-muted-foreground">Description</span><span className="font-mono text-xs">description</span>
                <span className="text-muted-foreground">Category</span><span className="font-mono text-xs">main_category</span>
                <span className="text-muted-foreground">Sub Category</span><span className="font-mono text-xs">category</span>
                <span className="text-muted-foreground">Price (USD $)</span><span className="font-mono text-xs">price_usd <span className="text-[0.65rem] text-muted-foreground font-sans">— fill if price is in USD, leave empty if using CNY</span></span>
                <span className="text-muted-foreground">Price (CNY ¥)</span><span className="font-mono text-xs">price_cny <span className="text-[0.65rem] text-muted-foreground font-sans">— fill if price is in CNY, leave empty if using USD</span></span>
                <span className="text-muted-foreground">Stock</span><span className="font-mono text-xs">stock</span>
                <span className="text-muted-foreground">Pricing Type</span><span className="font-mono text-xs">pricing_type <span className="text-[0.65rem] text-muted-foreground font-sans">— accepted values: Standard or Customized</span></span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Fill only ONE price field per product — either price_usd OR price_cny</p>
            </div>
            <div className="space-y-2">
              <Label>{t("uploadCsvFile")} (.csv, .xlsx, .xls)</Label>
              <Input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} disabled={importing} />
              {importFile && !importing && (
                <p className="text-sm text-muted-foreground">Selected: {importFile.name}</p>
              )}
              {importing && <p className="text-sm text-muted-foreground">{t("importingProducts")}</p>}
            </div>
            {importResult && showImportModal && (
              <div className={`p-3 rounded-lg text-sm ${importIsError ? "bg-destructive/10 text-destructive" : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"}`}>
                {importResult}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" /> {t("downloadSampleCsv")}
            </Button>
            <Button variant="outline" onClick={() => { setShowImportModal(false); setImportFile(null) }}>{tCommon("cancel")}</Button>
            <Button onClick={handleAnalyzePreview} disabled={!importFile} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Analyze &amp; Preview
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
        categoryData={categoryData}
      />
    </div>
  )
}
