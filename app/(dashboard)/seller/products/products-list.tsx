"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { Package, Download, Pencil, Trash2, FileSpreadsheet } from "lucide-react"
import { useTranslations } from "next-intl"
import readXlsxFile from "read-excel-file"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { WishlistButton } from "@/components/wishlist-button"
import { ProductShareButton } from "@/components/product-share-button"
import { ProductImageCarousel } from "@/components/product-image-carousel"
import { formatDualPrice, getStockStatus } from "@/lib/utils"
import { createProduct, updateProduct, deleteProduct, bulkImportProducts, uploadProductImage, createProductImageSignedUploadUrl, getProductFilePublicUrl } from "@/lib/actions/products"
import { deleteProductImage } from "@/lib/actions/product-images"
import { createClient } from "@/lib/supabase/client"
import { ImportPreview } from "@/components/bulk-edit/import-preview"
import type { ImportRow } from "@/components/bulk-edit/bulk-edit-table"
import type { CategoryData } from "@/lib/categories"
import { getSubcategoriesFromData, isMainCategoryInData, getMainCategoryForSubcategoryInData } from "@/lib/categories"
import { getCategoryIndex, getSubcategoryIndex } from "@/lib/sku"
import type { Product } from "@/types/database"
import type { PricingType, ProductImage } from "@/types/database"
import { useExchangeRate, usdToCny, cnyToUsd } from "@/lib/use-exchange-rate"
import { matchesProductSearch } from "@/components/product-search-dropdown"
import { useProductsPageHeader } from "@/components/layout/products-page-context"
import { CustomCategoryTabs, filterByCustomCategoryTab, type CustomCategoryTab } from "@/components/custom-category-tabs"

/** Upload a product image directly to Supabase Storage via signed URL (fast path). Falls back to server action. */
async function uploadProductImageDirect(file: File): Promise<string | null> {
  try {
    const ext = file.name.split(".").pop() || "jpg"
    const supabase = createClient()
    const signedResult = await createProductImageSignedUploadUrl(ext)
    if (signedResult.storagePath && signedResult.token && signedResult.path) {
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .uploadToSignedUrl(signedResult.path, signedResult.token, file, { contentType: file.type })
      if (!uploadError) {
        const urlResult = await getProductFilePublicUrl(signedResult.storagePath)
        if (urlResult.url) return urlResult.url
      }
    }
  } catch {
    // fall through to server-action fallback
  }
  // Fallback: server action upload
  const formData = new FormData()
  formData.append("file", file)
  const result = await uploadProductImage(formData)
  return result.url ?? null
}

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
  const row1 = "Steel Pipe A,SP-001,Measurement-based product,Construction,Exterior Gates,25.50,,200,Customized"
  const row2 = "LED Panel B,LP-002,Standard USD product,Electrical,Lighting,10.00,,100,Standard"
  const row3 = "Ceramic Tile C,CT-003,Standard CNY product,Construction,Tiles,,68.00,150,Standard"
  const csv = [header, row1, row2, row3].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "product-import-template.csv"
  a.click()
  URL.revokeObjectURL(url)
}

type ProductWithImages = Product & { images?: ProductImage[] }

export function SellerProductsList({ initialProducts, initialSearch = "", categoryData, wishlistedIds = [] }: { initialProducts: ProductWithImages[]; initialSearch?: string; categoryData: CategoryData; wishlistedIds?: string[] }) {
  const t = useTranslations("sellerProducts")
  const tCommon = useTranslations("common")
  const tBulk = useTranslations("bulkEdit")
  const { rate: exchangeRate, isLive: isLiveRate } = useExchangeRate()
  const [products, setProducts] = useState<ProductWithImages[]>(initialProducts)
  const {
    search,
    setSearch: ctxSetSearch,
    registerProducts,
    unregisterProducts,
    setOnAddProduct,
    setOnBulkImport,
    setOnProductClick,
  } = useProductsPageHeader()
  const [categoryFilter] = useState("")
  const [customCategoryTab, setCustomCategoryTab] = useState<CustomCategoryTab>("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [importIsError, setImportIsError] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<ImportRow[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [addingProduct, setAddingProduct] = useState(false)
  const [addProductError, setAddProductError] = useState<string | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: "",
    model_number: "",
    main_category: "",
    category: "",
    price_per_meter: 0,
    pricing_type: "standard" as PricingType,
    price_cny: 0,
    stock: 0,
    description: "",
  })
  const [newProductImage, setNewProductImage] = useState<File | null>(null)
  const [newProductImagePreview, setNewProductImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit modal state
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editForm, setEditForm] = useState({ name: "", model_number: "", main_category: "", category: "", price_per_meter: 0, pricing_type: "standard" as PricingType, price_cny: 0, stock: 0, description: "" })
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editCategory, setEditCategory] = useState("")

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Delete image confirmation state
  const [deleteImageTarget, setDeleteImageTarget] = useState<ProductImage | null>(null)
  const [deletingImage, setDeletingImage] = useState(false)

  const openEdit = useCallback((product: Product) => {
    setEditProduct(product)
    setEditForm({
      name: product.name,
      model_number: product.model_number,
      main_category: product.main_category,
      category: product.category,
      price_per_meter: product.price_per_meter,
      pricing_type: product.pricing_type || "standard",
      price_cny: product.price_cny || 0,
      stock: product.stock,
      description: product.description || "",
    })
    setEditCategory(product.main_category)
    setEditImage(null)
    setEditImagePreview(product.image_url || null)
    setDeleteImageTarget(null)
  }, [])

  // Register products and callbacks with the header context
  useEffect(() => {
    registerProducts(products)
  }, [products, registerProducts])

  useEffect(() => {
    if (initialSearch) ctxSetSearch(initialSearch)
    return () => {
      unregisterProducts()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- mount/unmount only

  const handleOpenAdd = useCallback(() => setShowAddModal(true), [])
  const handleOpenImport = useCallback(() => setShowImportModal(true), [])
  const handleProductClick = useCallback((productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) openEdit(product)
  }, [products, openEdit])

  useEffect(() => {
    setOnAddProduct(handleOpenAdd)
    setOnBulkImport(handleOpenImport)
    setOnProductClick(handleProductClick)
    return () => {
      setOnAddProduct(null)
      setOnBulkImport(null)
      setOnProductClick(null)
    }
  }, [handleOpenAdd, handleOpenImport, handleProductClick, setOnAddProduct, setOnBulkImport, setOnProductClick])

  const handleEditSave = async () => {
    if (!editProduct) return
    setEditSaving(true)
    try {
      // Upload new image if provided
      let imageUrl = editImagePreview
      if (editImage) {
        const uploadedUrl = await uploadProductImageDirect(editImage)
        if (uploadedUrl) imageUrl = uploadedUrl
      }

      const updates: Partial<Product> = {
        name: editForm.name,
        model_number: editForm.model_number,
        main_category: editForm.main_category,
        category: editForm.category,
        subcategory: editForm.category || null,
        price_per_meter: editForm.price_per_meter,
        pricing_type: editForm.pricing_type,
        price_usd: editForm.price_per_meter || null,
        price_cny: editForm.price_cny || null,
        stock: editForm.stock,
        description: editForm.description || null,
      }
      if (imageUrl) updates.image_url = imageUrl
      const result = await updateProduct(editProduct.id, updates)
      if (!result.error) {
        setProducts((prev) => prev.map((p) => p.id === editProduct.id ? { ...p, ...updates, image_url: imageUrl ?? p.image_url } : p))
        setEditProduct(null)
      }
    } catch {
      // error handled
    }
    setEditSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await deleteProduct(deleteTarget.id)
      if (!result.error) {
        setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
        setDeleteTarget(null)
        window.location.reload()
      }
    } catch {
      // error handled
    }
    setDeleting(false)
  }

  const handleDeleteImage = async () => {
    if (!deleteImageTarget || !editProduct) return
    setDeletingImage(true)
    try {
      const result = await deleteProductImage(deleteImageTarget.id)
      if (!result.error) {
        // Update the local images list for the product being edited
        setProducts((prev) => prev.map((p) => {
          if (p.id !== editProduct.id) return p
          const updated = (p.images ?? []).filter((img) => img.id !== deleteImageTarget.id)
          // If the deleted image was primary, promote the next one
          if (deleteImageTarget.is_primary && updated.length > 0) {
            updated[0] = { ...updated[0], is_primary: true }
          }
          return { ...p, images: updated }
        }))
        setDeleteImageTarget(null)
      }
    } catch {
      // error handled
    }
    setDeletingImage(false)
  }

  const resetAddForm = () => {
    setNewProduct({ name: "", model_number: "", main_category: "", category: "", price_per_meter: 0, pricing_type: "standard", price_cny: 0, stock: 0, description: "" })
    if (newProductImagePreview) URL.revokeObjectURL(newProductImagePreview)
    setNewProductImage(null)
    setNewProductImagePreview(null)
    setSelectedCategory("")
    setAddProductError(null)
  }

  const handleAddProduct = async () => {
    if (!newProduct.name) return
    setAddingProduct(true)
    setAddProductError(null)
    try {
      // Upload image if provided
      let imageUrl: string | null = null
      if (newProductImage) {
        const uploadedUrl = await uploadProductImageDirect(newProductImage)
        if (uploadedUrl) imageUrl = uploadedUrl
      }

      const result = await createProduct({
        name: newProduct.name,
        model_number: newProduct.model_number,
        main_category: newProduct.main_category,
        category: newProduct.category,
        subcategory: newProduct.category || null,
        price_per_meter: newProduct.price_per_meter,
        pricing_type: newProduct.pricing_type,
        price_usd: newProduct.price_per_meter || null,
        price_cny: newProduct.price_cny || null,
        stock: newProduct.stock,
        description: newProduct.description || null,
        image_url: imageUrl,
        is_active: true,
      })
      if (result.data) {
        setProducts((prev) => [result.data as Product, ...prev])
        setShowAddModal(false)
        resetAddForm()
        window.location.reload()
      } else if (result.error) {
        setAddProductError(result.error)
      }
    } catch (e) {
      setAddProductError(e instanceof Error ? e.message : t("failedToCreate"))
    }
    setAddingProduct(false)
  }

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
      let rows: Record<string, string>[]
      if (isExcelFile(importFile)) {
        rows = await parseExcelFile(importFile)
      } else {
        const text = await importFile.text()
        rows = parseCSV(text)
      }
      if (rows.length === 0) {
        setImportIsError(true)
        setImportResult(t("noValidRowsCsv"))
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
        const pricingType: "standard" | "customized" = rawPricingType === "customized" ? "customized" : "standard"
        let pricePerMeter = 0
        let priceUsd: number | null = null
        let priceCny: number | null = null

        if (rawPricePerMeter > 0) {
          pricePerMeter = rawPricePerMeter
          priceUsd = rawPricePerMeter
        } else if (rawPriceUsd > 0) {
          pricePerMeter = rawPriceUsd
          priceUsd = rawPriceUsd
        } else if (rawPriceCny > 0) {
          priceCny = rawPriceCny
        } else {
          pricePerMeter = Number(r.price) || 0
          priceUsd = pricePerMeter > 0 ? pricePerMeter : null
        }

        return {
          name: r.name || r.product_name || t("unnamedProduct"),
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
      setImportResult(t("failedParseCsv"))
    }
  }

  const handleFinishImport = async (rows: ImportRow[], imageFiles: (File | null)[]) => {
    setImporting(true)
    try {
      const finalRows = [...rows]
      let uploadFailures = 0
      for (let i = 0; i < finalRows.length; i++) {
        const file = imageFiles[i]
        if (file) {
          try {
            const url = await uploadProductImageDirect(file)
            if (url) {
              finalRows[i] = { ...finalRows[i], image_url: url }
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
      const result = await bulkImportProducts(finalRows)
      if (result.error) {
        setImporting(false)
        return
      }
      if (uploadFailures > 0) {
        console.warn(`${uploadFailures} image(s) failed to upload during bulk import`)
      }
      setShowPreview(false)
      setPreviewRows([])
      setImportFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      window.location.reload()
    } catch {
      // error handled
    }
    setImporting(false)
  }

  const filtered = filterByCustomCategoryTab(products, customCategoryTab).filter((p) => {
    const matchSearch = matchesProductSearch(p, search)
    const matchCategory = !categoryFilter || p.main_category === categoryFilter
    return matchSearch && matchCategory
  })

  return (
    <div>
      {/* Custom category tabs bar */}
      <CustomCategoryTabs
        products={products}
        activeTab={customCategoryTab}
        onTabChange={setCustomCategoryTab}
        className="mb-4 sticky top-[65px] z-20 bg-background"
      />
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const stockInfo = getStockStatus(product.stock)
            return (
              <Card key={product.id} className="group">
                <CardContent className="p-0">
                  <div className="aspect-square relative bg-card rounded-t-xl flex items-center justify-center overflow-hidden">
                    <ProductImageCarousel
                      images={product.images ?? []}
                      alt={product.name}
                    />
                  </div>
                  <div className="p-4">
                    <Badge variant="secondary" className="text-xs mb-2">{product.category}</Badge>
                    <h3 className="font-semibold text-sm">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.model_number}</p>
                    <p className="font-bold text-primary text-sm mt-2">{formatDualPrice(product.price_per_meter, product.price_cny, product.pricing_type, exchangeRate)}</p>
                    <Badge variant={stockInfo.color === "green" ? "success" : stockInfo.color === "yellow" ? "warning" : "destructive"} className="text-xs mt-1">
                      {stockInfo.label} ({product.stock})
                    </Badge>
                    <div className="flex items-center gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(product)}><Pencil className="h-3 w-3" /> {tCommon("edit")}</Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(product)}><Trash2 className="h-3 w-3" /></Button>
                      <ProductShareButton productName={product.name} modelNumber={product.model_number} price={product.price_per_meter} productId={product.id} />
                      <WishlistButton productId={product.id} initialLiked={wishlistedIds.includes(product.id)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={Package} title={t("noProducts")} description={search ? undefined : t("noProductsDesc")} action={search ? undefined : { label: t("addProduct"), onClick: () => setShowAddModal(true) }} />
      )}

      {/* Add Product Modal */}
      <Dialog open={showAddModal} onOpenChange={(v) => { setShowAddModal(v); if (!v) resetAddForm() }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("addProduct")}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4 overflow-y-auto min-h-0 flex-1">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("productName")}</Label><Input placeholder={t("productNamePlaceholder")} value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>{t("modelNumber")}</Label><Input placeholder={t("modelNumberPlaceholder")} value={newProduct.model_number} onChange={(e) => setNewProduct((p) => ({ ...p, model_number: e.target.value }))} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("mainCategory")}</Label>
                <Select options={categoryData.mainCategories.map((c) => ({ value: c, label: c }))} placeholder={t("selectCategory")} value={newProduct.main_category} onChange={(e) => { setSelectedCategory(e.target.value); setNewProduct((p) => ({ ...p, main_category: e.target.value, category: "" })) }} />
              </div>
              <div className="space-y-2">
                <Label>{t("subcategory")}</Label>
                <Select options={getSubcategoriesFromData(categoryData, newProduct.main_category || selectedCategory).map((c) => ({ value: c, label: c }))} placeholder={t("selectSubcategory")} value={newProduct.category} onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))} />
              </div>
            </div>
            {newProduct.main_category && newProduct.category && (
              <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{t("skuPreview")}: </span>
                <span className="font-mono font-medium text-primary">
                  IONE-{getCategoryIndex(categoryData, newProduct.main_category)}-{getSubcategoryIndex(categoryData, newProduct.main_category, newProduct.category)}-XXXX
                </span>
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("pricingType")}</Label>
              <Select
                options={[{ value: "standard", label: t("pricingStandard") }, { value: "customized", label: t("pricingCustomized") }]}
                value={newProduct.pricing_type}
                onChange={(e) => setNewProduct((p) => ({ ...p, pricing_type: e.target.value as PricingType }))}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("priceUsd")}{newProduct.pricing_type === "customized" ? "/m" : ""}</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={newProduct.price_per_meter || ""} onChange={(e) => {
                  const usd = Number(e.target.value)
                  setNewProduct((p) => ({ ...p, price_per_meter: usd, price_cny: usdToCny(usd, exchangeRate) }))
                }} />
              </div>
              <div className="space-y-2">
                <Label>{t("priceCny")}{newProduct.pricing_type === "customized" ? "/m" : ""}</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={newProduct.price_cny || ""} onChange={(e) => {
                  const cny = Number(e.target.value)
                  setNewProduct((p) => ({ ...p, price_cny: cny, price_per_meter: cnyToUsd(cny, exchangeRate) }))
                }} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">1 USD = {exchangeRate.toFixed(2)} CNY ({isLiveRate ? t("liveRate") : t("fallbackRate")})</p>
            <div className="grid sm:grid-cols-1 gap-4">
              <div className="space-y-2"><Label>{t("stock")}</Label><Input type="number" placeholder="0" value={newProduct.stock || ""} onChange={(e) => setNewProduct((p) => ({ ...p, stock: Number(e.target.value) }))} /></div>
            </div>
            <div className="space-y-2"><Label>{t("description")}</Label><Textarea placeholder={t("descriptionPlaceholder")} rows={3} value={newProduct.description} onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>{t("productImage")}</Label>
              {newProductImagePreview && (
                <div className="relative w-20 h-20 rounded border overflow-hidden mb-2">
                  <Image src={newProductImagePreview} alt={newProduct.name || "Product image"} fill className="object-cover" sizes="80px" />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (newProductImagePreview) URL.revokeObjectURL(newProductImagePreview)
                  setNewProductImage(file)
                  setNewProductImagePreview(URL.createObjectURL(file))
                }}
              />
            </div>
          </div>
          <DialogFooter>
            {addProductError && (
              <p className="text-sm text-destructive w-full text-left">{addProductError}</p>
            )}
            <Button variant="outline" onClick={() => { setShowAddModal(false); resetAddForm() }}>{tCommon("cancel")}</Button>
            <Button onClick={handleAddProduct} disabled={addingProduct || !newProduct.name}>{addingProduct ? tCommon("saving") : t("addProduct")}</Button>
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
            <div className="rounded-lg border p-4 bg-muted/50 max-h-[200px] overflow-y-auto">
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
                <span className="text-muted-foreground">{t("priceUsdCol")}</span><span className="font-mono text-xs">price_usd <span className="text-[0.65rem] text-muted-foreground font-sans">— {t("priceUsdColHint")}</span></span>
                <span className="text-muted-foreground">{t("priceCnyCol")}</span><span className="font-mono text-xs">price_cny <span className="text-[0.65rem] text-muted-foreground font-sans">— {t("priceCnyColHint")}</span></span>
                <span className="text-muted-foreground">{t("stockCol")}</span><span className="font-mono text-xs">stock</span>
                <span className="text-muted-foreground">{t("pricingType")}</span><span className="font-mono text-xs">pricing_type <span className="text-[0.65rem] text-muted-foreground font-sans">— accepted values: Standard or Customized</span></span>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">{t("fillOnlyOnePrice")}</p>
            </div>

            <div className="space-y-2">
              <Label>{tBulk("uploadCsvFile")} (.csv, .xlsx, .xls)</Label>
              <Input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} disabled={importing} />
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
        categoryData={categoryData}
      />

      {/* Edit Product Modal */}
      <Dialog open={!!editProduct} onOpenChange={(v) => { if (!v) { if (editImage && editImagePreview) URL.revokeObjectURL(editImagePreview); setEditProduct(null) } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("editProduct")}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4 overflow-y-auto min-h-0 flex-1">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("productName")}</Label><Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>{t("modelNumber")}</Label><Input value={editForm.model_number} onChange={(e) => setEditForm((f) => ({ ...f, model_number: e.target.value }))} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("mainCategory")}</Label>
                <Select options={categoryData.mainCategories.map((c) => ({ value: c, label: c }))} placeholder={t("selectCategory")} value={editForm.main_category} onChange={(e) => { setEditCategory(e.target.value); setEditForm((f) => ({ ...f, main_category: e.target.value, category: "" })) }} />
              </div>
              <div className="space-y-2">
                <Label>{t("subcategory")}</Label>
                <Select options={getSubcategoriesFromData(categoryData, editForm.main_category || editCategory).map((c) => ({ value: c, label: c }))} placeholder={t("selectSubcategory")} value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} />
              </div>
            </div>
            {editForm.main_category && editForm.category && (
              <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{t("skuPreview")}: </span>
                <span className="font-mono font-medium text-primary">
                  IONE-{getCategoryIndex(categoryData, editForm.main_category)}-{getSubcategoryIndex(categoryData, editForm.main_category, editForm.category)}-XXXX
                </span>
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("pricingType")}</Label>
              <Select
                options={[{ value: "standard", label: t("pricingStandard") }, { value: "customized", label: t("pricingCustomized") }]}
                value={editForm.pricing_type}
                onChange={(e) => setEditForm((f) => ({ ...f, pricing_type: e.target.value as PricingType }))}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("priceUsd")}{editForm.pricing_type === "customized" ? "/m" : ""}</Label>
                <Input type="number" step="0.01" value={editForm.price_per_meter || ""} onChange={(e) => {
                  const usd = Number(e.target.value)
                  setEditForm((f) => ({ ...f, price_per_meter: usd, price_cny: usdToCny(usd, exchangeRate) }))
                }} />
              </div>
              <div className="space-y-2">
                <Label>{t("priceCny")}{editForm.pricing_type === "customized" ? "/m" : ""}</Label>
                <Input type="number" step="0.01" value={editForm.price_cny || ""} onChange={(e) => {
                  const cny = Number(e.target.value)
                  setEditForm((f) => ({ ...f, price_cny: cny, price_per_meter: cnyToUsd(cny, exchangeRate) }))
                }} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">1 USD = {exchangeRate.toFixed(2)} CNY ({isLiveRate ? t("liveRate") : t("fallbackRate")})</p>
            <div className="grid sm:grid-cols-1 gap-4">
              <div className="space-y-2"><Label>{t("stock")}</Label><Input type="number" value={editForm.stock || ""} onChange={(e) => setEditForm((f) => ({ ...f, stock: Number(e.target.value) }))} /></div>
            </div>
            <div className="space-y-2"><Label>{t("description")}</Label><Textarea rows={3} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} /></div>
            {/* Existing product images from product_images table */}
            {editProduct && (() => {
              const currentProduct = products.find((p) => p.id === editProduct.id)
              const imgs = currentProduct?.images ?? []
              return imgs.length > 0 ? (
                <div className="space-y-2">
                  <Label>{t("productImages")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {imgs.map((img) => (
                      <div key={img.id} className="relative w-20 h-20 rounded border overflow-hidden group/img">
                        <Image src={img.image_url} alt={editProduct.name || "Product image"} fill className="object-cover" sizes="80px" />
                        {img.is_primary && (
                          <span className="absolute top-0 left-0 bg-primary text-primary-foreground text-[10px] px-1 rounded-br">★</span>
                        )}
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                          onClick={() => setDeleteImageTarget(img)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            })()}
            <div className="space-y-2">
              <Label>{t("productImage")}</Label>
              {editImagePreview && (
                <div className="relative w-20 h-20 rounded border overflow-hidden mb-2">
                  <Image src={editImagePreview} alt={editProduct?.name || "Product image"} fill className="object-cover" sizes="80px" />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (editImage && editImagePreview) URL.revokeObjectURL(editImagePreview)
                  setEditImage(file)
                  setEditImagePreview(URL.createObjectURL(file))
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { if (editImage && editImagePreview) URL.revokeObjectURL(editImagePreview); setEditProduct(null) }}>{tCommon("cancel")}</Button>
            <Button onClick={handleEditSave} disabled={editSaving || !editForm.name}>
              {editSaving ? tCommon("saving") : t("saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("deleteProduct")}</DialogTitle></DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              {t("deleteConfirmation", { name: deleteTarget?.name ?? "" })}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{tCommon("cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("deleting") : tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Image Confirmation */}
      <Dialog open={!!deleteImageTarget} onOpenChange={(v) => { if (!v) setDeleteImageTarget(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("deleteImage")}</DialogTitle></DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              {t("deleteImageConfirm")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteImageTarget(null)}>{tCommon("cancel")}</Button>
            <Button variant="destructive" onClick={handleDeleteImage} disabled={deletingImage}>
              {deletingImage ? t("deleting") : tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
