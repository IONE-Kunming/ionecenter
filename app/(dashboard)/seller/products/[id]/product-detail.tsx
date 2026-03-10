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
  const tCommon = useTranslations("common")
  const { rate } = useExchangeRate()
  const stockInfo = getStockStatus(product.stock)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {tCommon("back")}
        </button>
        <div className="flex items-center gap-2">
          <WishlistButton productId={product.id} initialLiked={wishlistedIds.includes(product.id)} size="md" />
          <Link href={`/seller/products?edit=${product.id}`}>
            <Button className="gap-2">
              <Pencil className="h-4 w-4" />
              {tCommon("edit")}
            </Button>
          </Link>
        </div>
      </div>

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

          {/* Videos */}
          {(product.video_urls ?? []).length > 0 && (
            <div className="space-y-2 mt-3">
              {(product.video_urls ?? []).map((url, i) => (
                <video key={i} src={url} controls className="w-full rounded-lg" preload="none" />
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
            <Badge variant={stockInfo.color === "green" ? "success" : stockInfo.color === "yellow" ? "warning" : "destructive"}>
              {stockInfo.label}
            </Badge>
            <span className="text-sm text-muted-foreground">{product.stock} {t("unitsAvailable")}</span>
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
    </div>
  )
}
