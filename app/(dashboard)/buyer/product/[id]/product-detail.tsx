"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { ArrowLeft, Package, ShoppingCart, MessageSquare, ShieldAlert, PlayCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toaster"
import { getStockStatus } from "@/lib/utils"
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
  const stockStatus = getStockStatus(product.stock)

  // Build unified media list: images first, then videos
  const allImages = [
    ...(product.image_url ? [{ type: "image" as const, url: product.image_url }] : []),
    ...(product.additional_images ?? []).map((u) => ({ type: "image" as const, url: u })),
  ]
  const allVideos = (product.video_urls ?? []).map((u) => ({ type: "video" as const, url: u }))
  const allMedia = [...allImages, ...allVideos]
  const [mediaIndex, setMediaIndex] = useState(0)
  const currentMedia = allMedia[mediaIndex] ?? null

  function handleChatWithSeller() {
    startChat(async () => {
      const conversation = await getOrCreateConversation(product.id, product.seller_id)
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
        addToast("success", t("addedToCart"))
      }
    })
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
        {/* Product Media */}
        <div className="space-y-3">
          <div className="aspect-square relative bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center overflow-hidden">
            {currentMedia?.type === "image" ? (
              <Image
                src={currentMedia.url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : currentMedia?.type === "video" ? (
              <video
                src={currentMedia.url}
                controls
                className="w-full h-full object-contain"
                preload="metadata"
              />
            ) : (
              <Package className="h-24 w-24 text-muted-foreground/20" />
            )}
            {allMedia.length > 1 && (
              <>
                <button
                  onClick={() => setMediaIndex((i) => (i - 1 + allMedia.length) % allMedia.length)}
                  className="absolute start-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setMediaIndex((i) => (i + 1) % allMedia.length)}
                  className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {allMedia.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allMedia.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setMediaIndex(i)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-colors ${i === mediaIndex ? "border-primary" : "border-transparent"}`}
                >
                  {m.type === "image" ? (
                    <Image src={m.url} alt="" fill className="object-cover" sizes="64px" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <PlayCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <Badge variant="secondary">{product.category}</Badge>
          <h1 className="mt-3 text-3xl font-bold">{product.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("modelNumber")}: {product.model_number}</p>

          <div className="mt-6">
            <span className="text-3xl font-bold text-primary">
              {formatDualPrice(product.price_per_meter, product.price_cny, product.pricing_type, rate)}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Badge variant={stockStatus.color === "green" ? "success" : stockStatus.color === "yellow" ? "warning" : "destructive"}>
              {stockStatus.label}
            </Badge>
            <span className="text-sm text-muted-foreground">{product.stock} {t("unitsAvailable")}</span>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3">
              <label htmlFor="quantity" className="text-sm font-medium">{t("quantity")}:</label>
              <input
                id="quantity"
                type="number"
                min={1}
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value))))}
                className="w-20 rounded-md border px-3 py-1.5 text-sm"
              />
            </div>
            <Button className="w-full gap-2" size="lg" onClick={handleAddToCart} disabled={cartPending}>
              <ShoppingCart className="h-4 w-4" />
              {cartPending ? t("addingToCart") : t("addToCart")}
            </Button>
            {product.seller_id !== currentUserId && (
              <Button variant="outline" className="w-full gap-2" size="lg" onClick={handleChatWithSeller} disabled={chatPending}>
                <MessageSquare className="h-4 w-4" />
                {chatPending ? tCommon("loading") : t("chatWithSeller")}
              </Button>
            )}
          </div>

          {product.seller_name && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <h3 className="font-semibold">{t("sellerInfo")}</h3>
                <p className="text-sm text-muted-foreground mt-1">{product.seller_name}</p>
              </CardContent>
            </Card>
          )}
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

      {/* Specifications */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-3">{t("specifications")}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t("category")}</span>
              <span className="font-medium">{product.main_category}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t("subcategory")}</span>
              <span className="font-medium">{product.category}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t("modelNumber")}</span>
              <span className="font-medium">{product.model_number}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t("price")}</span>
              <span className="font-medium">{formatDualPrice(product.price_per_meter, product.price_cny, product.pricing_type, rate)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

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

