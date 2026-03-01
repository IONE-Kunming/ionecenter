"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "@/components/ui/link"
import { useTranslations } from "next-intl"
import { Heart, Package } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { WishlistButton } from "@/components/wishlist-button"
import { formatDualPrice, getStockStatus } from "@/lib/utils"
import { useExchangeRate } from "@/lib/use-exchange-rate"
import type { WishlistProductItem } from "@/lib/actions/wishlist"

export function MyListContent({ products, basePath }: { products: WishlistProductItem[]; basePath: string }) {
  const t = useTranslations("wishlist")
  const { rate } = useExchangeRate()
  const [visibleProducts, setVisibleProducts] = useState(products)

  const handleToggle = useCallback((productId: string, liked: boolean) => {
    if (!liked) {
      setVisibleProducts((prev) => prev.filter((p) => p.id !== productId))
    }
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {visibleProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleProducts.map((product) => {
            const stockInfo = getStockStatus(product.stock)
            return (
              <Card key={product.wishlist_id} className="group hover:shadow-md transition-all">
                <CardContent className="p-0">
                  <Link href={`${basePath}/${product.id}`}>
                    <div className="aspect-square relative bg-gradient-to-br from-muted to-muted/50 rounded-t-xl flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <Package className="h-12 w-12 text-muted-foreground/30" />
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                      <Badge variant={stockInfo.color === "green" ? "success" : stockInfo.color === "yellow" ? "warning" : "destructive"} className="text-xs">
                        {stockInfo.label} ({product.stock})
                      </Badge>
                    </div>
                    <Link href={`${basePath}/${product.id}`}>
                      <h3 className="font-semibold text-sm line-clamp-1 hover:underline">{product.name}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">{product.model_number}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-primary">{formatDualPrice(product.price_per_meter, product.price_cny ?? null, (product.pricing_type || "standard") as "standard" | "customized", rate)}</span>
                      <WishlistButton productId={product.id} initialLiked={true} onToggle={(liked) => handleToggle(product.id, liked)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      )}
    </div>
  )
}
