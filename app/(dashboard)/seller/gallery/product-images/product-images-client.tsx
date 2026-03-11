"use client"

import { useState, useRef } from "react"
import NextImage from "next/image"
import { useTranslations } from "next-intl"
import {
  Star, Trash2, Plus, Loader2, LayoutList, LayoutGrid, ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  setProductImageAsPrimary,
  deleteProductImage,
  addImagesToProduct,
  getSellerProductsWithImages,
} from "@/lib/actions/product-images"
import type { ProductWithImages } from "@/lib/actions/product-images"
import { createProductImageSignedUploadUrl, getProductFilePublicUrl } from "@/lib/actions/products"
import { createClient } from "@/lib/supabase/client"

interface ProductImagesClientProps {
  initialProducts: ProductWithImages[]
}

export function ProductImagesClient({ initialProducts }: ProductImagesClientProps) {
  const t = useTranslations("productImages")
  const [products, setProducts] = useState(initialProducts)
  const [view, setView] = useState<"list" | "grid">("grid")

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<{ imageId: string; productId: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Upload state per product
  const [uploadingProduct, setUploadingProduct] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Setting primary state
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null)

  async function refreshProducts() {
    const updated = await getSellerProductsWithImages()
    setProducts(updated)
  }

  async function handleSetPrimary(imageId: string) {
    setSettingPrimary(imageId)
    const result = await setProductImageAsPrimary(imageId)
    if (result.success) {
      await refreshProducts()
    }
    setSettingPrimary(null)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteProductImage(deleteTarget.imageId)
    if (result.success) {
      await refreshProducts()
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  async function handleAddImages(productId: string, files: FileList) {
    setUploadingProduct(productId)
    const uploadedUrls: string[] = []
    const supabase = createClient()

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() || "jpg"
      const { signedUrl, token, storagePath, error } = await createProductImageSignedUploadUrl(ext)
      if (error || !signedUrl || !token || !storagePath) continue

      const { error: uploadErr } = await supabase.storage
        .from("product-images")
        .uploadToSignedUrl(storagePath, token, file)
      if (uploadErr) continue

      const { url } = await getProductFilePublicUrl(storagePath)
      if (url) uploadedUrls.push(url)
    }

    if (uploadedUrls.length > 0) {
      await addImagesToProduct(productId, uploadedUrls)
      await refreshProducts()
    }

    setUploadingProduct(null)
  }

  function openFilePicker(productId: string) {
    const input = fileInputRefs.current[productId]
    if (input) input.click()
  }

  const productsWithImages = products.filter((p) => p.images.length > 0)
  const productsWithoutImages = products.filter((p) => p.images.length === 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            <LayoutList className="h-4 w-4" />
            {t("listView")}
          </Button>
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
            {t("gridView")}
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">{t("noProducts")}</p>
          <p className="text-sm text-muted-foreground">{t("noProductsDesc")}</p>
        </div>
      ) : view === "list" ? (
        <ListView
          products={productsWithImages}
          productsWithoutImages={productsWithoutImages}
          settingPrimary={settingPrimary}
          uploadingProduct={uploadingProduct}
          fileInputRefs={fileInputRefs}
          onSetPrimary={handleSetPrimary}
          onDelete={(imageId, productId) => setDeleteTarget({ imageId, productId })}
          onAddImages={handleAddImages}
          onOpenFilePicker={openFilePicker}
          t={t}
        />
      ) : (
        <GridView
          products={productsWithImages}
          productsWithoutImages={productsWithoutImages}
          settingPrimary={settingPrimary}
          uploadingProduct={uploadingProduct}
          fileInputRefs={fileInputRefs}
          onSetPrimary={handleSetPrimary}
          onDelete={(imageId, productId) => setDeleteTarget({ imageId, productId })}
          onAddImages={handleAddImages}
          onOpenFilePicker={openFilePicker}
          t={t}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => !deleting && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteImage")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("deleteConfirm")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ─── Shared types for sub-components ─── */

type TranslationFn = (key: string) => string

interface ViewProps {
  products: ProductWithImages[]
  productsWithoutImages: ProductWithImages[]
  settingPrimary: string | null
  uploadingProduct: string | null
  fileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>
  onSetPrimary: (imageId: string) => void
  onDelete: (imageId: string, productId: string) => void
  onAddImages: (productId: string, files: FileList) => void
  onOpenFilePicker: (productId: string) => void
  t: TranslationFn
}

/* ─── List View ─── */

function ListView({
  products, productsWithoutImages, settingPrimary, uploadingProduct, fileInputRefs,
  onSetPrimary, onDelete, onAddImages, onOpenFilePicker, t,
}: ViewProps) {
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <div key={product.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.model_number}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{product.images.length} {t("images")}</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenFilePicker(product.id)}
                disabled={uploadingProduct === product.id}
              >
                {uploadingProduct === product.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {t("addImages")}
              </Button>
              <input
                ref={(el) => { fileInputRefs.current[product.id] = el }}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onAddImages(product.id, e.target.files)
                    e.target.value = ""
                  }
                }}
              />
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {product.images.map((img) => (
              <ImageCard
                key={img.id}
                imageId={img.id}
                imageUrl={img.image_url}
                isPrimary={img.is_primary}
                productId={product.id}
                settingPrimary={settingPrimary}
                onSetPrimary={onSetPrimary}
                onDelete={onDelete}
                t={t}
                compact
              />
            ))}
          </div>
        </div>
      ))}

      {/* Products without images */}
      {productsWithoutImages.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">{t("noImagesSection")}</h2>
          <div className="space-y-2">
            {productsWithoutImages.map((product) => (
              <div key={product.id} className="rounded-lg border bg-card p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.model_number}</p>
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenFilePicker(product.id)}
                    disabled={uploadingProduct === product.id}
                  >
                    {uploadingProduct === product.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {t("addImages")}
                  </Button>
                  <input
                    ref={(el) => { fileInputRefs.current[product.id] = el }}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        onAddImages(product.id, e.target.files)
                        e.target.value = ""
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Grid View ─── */

function GridView({
  products, productsWithoutImages, settingPrimary, uploadingProduct, fileInputRefs,
  onSetPrimary, onDelete, onAddImages, onOpenFilePicker, t,
}: ViewProps) {
  return (
    <div className="space-y-8">
      {products.map((product) => (
        <div key={product.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.model_number}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{product.images.length} {t("images")}</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenFilePicker(product.id)}
                disabled={uploadingProduct === product.id}
              >
                {uploadingProduct === product.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {t("addImages")}
              </Button>
              <input
                ref={(el) => { fileInputRefs.current[product.id] = el }}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onAddImages(product.id, e.target.files)
                    e.target.value = ""
                  }
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {product.images.map((img) => (
              <ImageCard
                key={img.id}
                imageId={img.id}
                imageUrl={img.image_url}
                isPrimary={img.is_primary}
                productId={product.id}
                settingPrimary={settingPrimary}
                onSetPrimary={onSetPrimary}
                onDelete={onDelete}
                t={t}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Products without images */}
      {productsWithoutImages.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">{t("noImagesSection")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {productsWithoutImages.map((product) => (
              <div key={product.id} className="rounded-lg border bg-card p-4 flex flex-col items-center gap-3">
                <div className="w-full">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.model_number}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onOpenFilePicker(product.id)}
                  disabled={uploadingProduct === product.id}
                >
                  {uploadingProduct === product.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {t("addImages")}
                </Button>
                <input
                  ref={(el) => { fileInputRefs.current[product.id] = el }}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      onAddImages(product.id, e.target.files)
                      e.target.value = ""
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Image Card ─── */

interface ImageCardProps {
  imageId: string
  imageUrl: string
  isPrimary: boolean
  productId: string
  settingPrimary: string | null
  onSetPrimary: (imageId: string) => void
  onDelete: (imageId: string, productId: string) => void
  t: TranslationFn
  compact?: boolean
}

function ImageCard({
  imageId, imageUrl, isPrimary, productId, settingPrimary,
  onSetPrimary, onDelete, t, compact,
}: ImageCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-lg border overflow-hidden bg-muted",
        compact ? "w-32 flex-shrink-0" : "w-full",
        isPrimary && "ring-2 ring-yellow-400"
      )}
    >
      <div className={cn("relative", compact ? "h-32 w-32" : "aspect-square w-full")}>
        <NextImage
          src={imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes={compact ? "128px" : "(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"}
        />
        {/* Primary badge */}
        {isPrimary && (
          <div className="absolute top-1 start-1">
            <Badge variant="warning" className="gap-1 text-[10px] px-1.5 py-0.5">
              <Star className="h-3 w-3 fill-current" />
              {t("primary")}
            </Badge>
          </div>
        )}
        {/* Action overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center gap-1 p-1.5 opacity-0 group-hover:opacity-100">
          {!isPrimary && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-[11px] px-2"
              onClick={() => onSetPrimary(imageId)}
              disabled={settingPrimary === imageId}
            >
              {settingPrimary === imageId ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Star className="h-3 w-3" />
              )}
              {t("setPrimary")}
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            className="h-7 text-[11px] px-2"
            onClick={() => onDelete(imageId, productId)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
