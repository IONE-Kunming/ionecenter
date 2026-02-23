"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, Package, ShoppingCart, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, getStockStatus } from "@/lib/utils"
import { getOrCreateConversation } from "@/lib/actions/chat"
import { addToCart } from "@/lib/actions/cart"
import type { Product } from "@/types/database"

interface ProductDetailProps {
  product: Product
  currentUserId: string
}

export function ProductDetail({ product, currentUserId }: ProductDetailProps) {
  const router = useRouter()
  const t = useTranslations("productDetail")
  const tCommon = useTranslations("common")
  const [chatPending, startChat] = useTransition()
  const [cartPending, startCart] = useTransition()
  const [quantity, setQuantity] = useState(1)
  const stockStatus = getStockStatus(product.stock)

  function handleChatWithSeller() {
    startChat(async () => {
      const conversation = await getOrCreateConversation(product.id, product.seller_id)
      if (conversation) {
        router.push(`/buyer/chats?id=${conversation.id}`)
      }
    })
  }

  function handleAddToCart() {
    startCart(async () => {
      await addToCart(product.id, quantity)
      router.push("/buyer/cart")
    })
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {tCommon("back")}
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center">
          <Package className="h-24 w-24 text-muted-foreground/20" />
        </div>

        {/* Product Info */}
        <div>
          <Badge variant="secondary">{product.category}</Badge>
          <h1 className="mt-3 text-3xl font-bold">{product.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("modelNumber")}: {product.model_number}</p>

          <div className="mt-6">
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(product.price_per_meter)}
            </span>
            <span className="text-muted-foreground">{t("perMeter")}</span>
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
              <span className="text-muted-foreground">{t("pricePerMeter")}</span>
              <span className="font-medium">{formatCurrency(product.price_per_meter)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
