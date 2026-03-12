"use client"

import { useState, useTransition, useMemo } from "react"
import { useTranslations } from "next-intl"
import { ArrowLeft, ShoppingCart, MessageSquare, ShieldAlert, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toaster"
import { useFormatters } from "@/lib/use-formatters"
import { useExchangeRate } from "@/lib/use-exchange-rate"
import { getOrCreateConversation } from "@/lib/actions/chat"
import { addToCart } from "@/lib/actions/cart"
import { ProductDetailGallery } from "@/components/product-detail-gallery"
import type { Product, UserRole } from "@/types/database"

interface ProductDetailProps {
  product: Product
  currentUserId: string
  userRole?: UserRole | null
  productImages?: { image_url: string; is_primary: boolean }[]
}

function getDetailStockStatus(stock: number): { color: "green" | "yellow" | "red"; key: string } {
  if (stock <= 0) return { color: "red", key: "outOfStock" }
  if (stock <= 200) return { color: "yellow", key: "lowStock" }
  return { color: "green", key: "inStock" }
}

export function ProductDetail({ product, currentUserId, userRole, productImages = [] }: ProductDetailProps) {
  const t = useTranslations("productDetail")
  const tCommon = useTranslations("common")
  const { addToast } = useToast()
  const { rate } = useExchangeRate()
  const { formatCurrency, formatDualPrice } = useFormatters()
  const [chatPending, startChat] = useTransition()
  const [cartPending, startCart] = useTransition()
  const [quantity, setQuantity] = useState(1)
  const [showSellerModal, setShowSellerModal] = useState(false)
  const stockStatus = getDetailStockStatus(product.stock)
  const isOutOfStock = product.stock <= 0

  const isCustomized = product.pricing_type === "customized"
  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")

  const customizedTotal = useMemo(() => {
    if (!isCustomized) return null
    const l = parseFloat(length)
    const w = parseFloat(width)
    if (isNaN(l) || isNaN(w) || l < 0.01 || w < 0.01) return null
    const totalMeters = l + w
    const totalUsd = totalMeters * product.price_per_meter * quantity
    const convertedCny = rate != null ? totalMeters * product.price_per_meter * rate * quantity : null
    return { totalMeters, totalUsd, totalCny: convertedCny }
  }, [isCustomized, length, width, quantity, product.price_per_meter, rate])

  // Build video list
  const allVideos = (product.video_urls ?? [])

  function handleChatWithSeller() {
    startChat(async () => {
      const conversation = await getOrCreateConversation(product.seller_id)
      if (conversation) {
        window.location.href = `/buyer/chats?id=${conversation.id}`
      }
    })
  }

  function handleAddToCart() {
    if (userRole === "seller") {
      setShowSellerModal(true)
      return
    }
    if (isCustomized) {
      const l = parseFloat(length)
      const w = parseFloat(width)
      if (isNaN(l) || isNaN(w) || l < 0.01 || w < 0.01) {
        addToast("error", t("enterDimensions"))
        return
      }
    }
    startCart(async () => {
      const dimensions = isCustomized && customizedTotal
        ? {
            length: parseFloat(length),
            width: parseFloat(width),
            total_meters: customizedTotal.totalMeters,
            total_price: customizedTotal.totalUsd,
          }
        : undefined
      const result = await addToCart(product.id, quantity, dimensions)
      if (result.error) {
        addToast("error", result.error)
      } else {
        addToast("success", t("addedToCartSuccess"))
      }
    })
  }

  function handleQuantityChange(value: number) {
    setQuantity(Math.max(1, Math.min(product.stock, value)))
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {tCommon("back")}
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="space-y-3">
          <ProductDetailGallery
            images={productImages}
            alt={product.name}
          />

          {/* Videos */}
          {allVideos.length > 0 && (
            <div className="space-y-2">
              {allVideos.map((url, i) => (
                <video
                  key={i}
                  src={url}
                  controls
                  className="w-full rounded-lg"
                  preload="none"
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("modelNumber")}: {product.model_number}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("category")}: {product.main_category}
            {product.category && <> · {t("subcategory")}: {product.category}</>}
          </p>
          {product.seller_name && (
            <p className="mt-1 text-sm text-muted-foreground">{t("seller")}: {product.seller_name}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {t("pricingType")}: {product.pricing_type === "customized" ? t("customized") : t("standard")}
            {product.pricing_type === "customized" && <span className="text-xs"> /m</span>}
          </p>

          <div className="mt-6">
            <span className="text-3xl font-bold text-primary">
              {formatDualPrice(product.price_per_meter, product.price_cny, product.pricing_type, rate)}
            </span>
          </div>

          {/* Dimensions inputs for Customized products */}
          {isCustomized && (
            <div className="mt-4 space-y-3 rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <label htmlFor="length" className="text-sm font-medium w-24">{t("lengthM")}:</label>
                <input
                  id="length"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="0.00"
                  disabled={isOutOfStock}
                  className="h-9 w-32 rounded-md border px-3 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="width" className="text-sm font-medium w-24">{t("widthM")}:</label>
                <input
                  id="width"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="0.00"
                  disabled={isOutOfStock}
                  className="h-9 w-32 rounded-md border px-3 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              {customizedTotal && (
                <div className="pt-2 border-t text-sm font-semibold text-primary">
                  {t("totalLabel")}: {formatCurrency(customizedTotal.totalUsd)}
                  {customizedTotal.totalCny != null && (
                    <> | {formatCurrency(customizedTotal.totalCny, "CNY")}</>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center gap-4">
            <Badge variant={stockStatus.color === "green" ? "success" : stockStatus.color === "yellow" ? "warning" : "destructive"}>
              {t(stockStatus.key)}
            </Badge>
            <span className="text-sm text-muted-foreground">{product.stock} {t("unitsAvailable")}</span>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3">
              <label htmlFor="quantity" className="text-sm font-medium">{t("quantity")}:</label>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1 || isOutOfStock}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(Number(e.target.value))}
                  disabled={isOutOfStock}
                  aria-label="Quantity"
                  className="h-9 w-16 border-y text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-l-none"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= product.stock || isOutOfStock}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleAddToCart}
              disabled={cartPending || isOutOfStock}
            >
              <ShoppingCart className="h-4 w-4" />
              {isOutOfStock ? t("outOfStock") : cartPending ? t("addingToCart") : t("addToCart")}
            </Button>
            {product.seller_id !== currentUserId && (
              <Button variant="outline" className="w-full gap-2" size="lg" onClick={handleChatWithSeller} disabled={chatPending}>
                <MessageSquare className="h-4 w-4" />
                {chatPending ? tCommon("loading") : t("chatWithSeller")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-3">{t("productDescription")}</h2>
            <p className="text-muted-foreground">{product.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Seller Cart Blocked Modal */}
      <Dialog open={showSellerModal} onOpenChange={setShowSellerModal}>
        <DialogContent className="text-center">
          <DialogHeader className="items-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">{t("sellerCartBlockedTitle")}</DialogTitle>
            <DialogDescription className="text-center">
              {t("sellerCartBlocked")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowSellerModal(false)}>
              {t("sellerCartBlockedButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

