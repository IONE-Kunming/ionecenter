"use client"

import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "@/components/ui/link"
import { ArrowLeft, Package, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { WishlistButton } from "@/components/wishlist-button"
import { formatDualPrice, getStockStatus } from "@/lib/utils"
import { useExchangeRate } from "@/lib/use-exchange-rate"
import type { Product } from "@/types/database"

interface SellerProductDetailProps {
  product: Product
  wishlistedIds: string[]
}

export function SellerProductDetail({ product, wishlistedIds }: SellerProductDetailProps) {
  const t = useTranslations("productDetail")
  const tSeller = useTranslations("sellerProducts")
  const tCommon = useTranslations("common")
  const { rate } = useExchangeRate()
  const stockInfo = getStockStatus(product.stock)

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
        <div>
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
        </div>

        {/* Product Info */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <WishlistButton productId={product.id} initialLiked={wishlistedIds.includes(product.id)} size="md" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{t("modelNumber")}: {product.model_number}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("category")}: {product.main_category}
            {product.category && <> · {t("subcategory")}: {product.category}</>}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tSeller("pricingType")}: {product.pricing_type === "customized" ? tSeller("pricingCustomized") : tSeller("pricingStandard")}
          </p>

          <div className="mt-6">
            <span className="text-3xl font-bold text-primary">
              {formatDualPrice(product.price_per_meter, product.price_cny, product.pricing_type, rate)}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Badge variant={stockInfo.color === "green" ? "success" : stockInfo.color === "yellow" ? "warning" : "destructive"}>
              {stockInfo.label}
            </Badge>
            <span className="text-sm text-muted-foreground">{product.stock} {t("unitsAvailable")}</span>
          </div>

          {product.description && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">{tSeller("description")}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{product.description}</p>
              </CardContent>
            </Card>
          )}

          <div className="mt-6">
            <Link href={`/seller/products?edit=${product.id}`}>
              <Button className="gap-2">
                <Pencil className="h-4 w-4" />
                {tCommon("edit")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
