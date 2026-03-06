"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { ArrowLeft, Package, ShoppingCart, MessageSquare, ShieldAlert, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toaster"
import { useFormatters } from "@/lib/use-formatters"
import { useExchangeRate } from "@/lib/use-exchange-rate"
import { getOrCreateConversation } from "@/lib/actions/chat"
import { addToCart } from "@/lib/actions/cart"
import type { Product, UserRole } from "@/types/database"

interface ProductDetailProps {
  product: Product
  currentUserId: string
  userRole?: UserRole | null
}

function getDetailStockStatus(stock: number): { label: string; color: "green" | "yellow" | "red"; key: string } {
  if (stock <= 0) return { label: "Out of Stock", color: "red", key: "outOfStock" }
  if (stock <= 200) return { label: "Low Stock", color: "yellow", key: "lowStock" }
  return { label: "In Stock", color: "green", key: "inStock" }
}

export function ProductDetail({ product, currentUserId, userRole }: ProductDetailProps) {
  const t = useTranslations("productDetail")
  const tCommon = useTranslations("common")
  const { addToast } = useToast()
  const { rate } = useExchangeRate()
  const { formatDualPrice } = useFormatters()
  const [chatPending, startChat] = useTransition()
  const [cartPending, startCart] = useTransition()
  const [quantity, setQuantity] = useState(1)
  const [showSellerModal, setShowSellerModal] = useState(false)
  const stockStatus = getDetailStockStatus(product.stock)
  const isOutOfStock = product.stock <= 0

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
    startCart(async () => {
      const result = await addToCart(product.id, quantity)
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
          <div className="aspect-square relative bg-white rounded-xl flex items-center justify-center overflow-hidden">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <Package className="h-24 w-24 text-muted-foreground/20" />
            )}
          </div>

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

