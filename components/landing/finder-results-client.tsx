"use client"

import { useState, useTransition, useCallback } from "react"
import { useTranslations } from "next-intl"
import Link from "@/components/ui/link"
import Image from "next/image"
import {
  Package, ShoppingCart, Check, Loader2, ChevronLeft,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDualPrice } from "@/lib/utils"
import { useExchangeRate } from "@/lib/use-exchange-rate"
import { addToCart } from "@/lib/actions/cart"
import type { PricingType } from "@/types/database"

/* ───────── Types ───────── */

interface FinderProduct {
  id: string
  name: string
  model_number: string
  main_category: string
  category: string
  price_per_meter: number
  pricing_type?: PricingType
  price_cny?: number | null
  stock: number
  image_url: string | null
  seller_name?: string | null
}

interface FinderResultsClientProps {
  products: FinderProduct[]
  category: string
  subcategory: string
  region: string
  isLoggedIn: boolean
  userRole: string | null
}

/* ───────── Component ───────── */

export function FinderResultsClient({
  products,
  category,
  subcategory,
  region,
  isLoggedIn,
  userRole,
}: FinderResultsClientProps) {
  const t = useTranslations("productFinder")
  const tNav = useTranslations("nav")
  const tCommon = useTranslations("common")
  const tCart = useTranslations("cart")
  const { rate } = useExchangeRate()

  /* ── Cart / sign-in state ── */
  const [, startTransition] = useTransition()
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [showSignInDialog, setShowSignInDialog] = useState(false)

  const performAddToCart = useCallback((productId: string) => {
    setAddingIds((prev) => {
      if (prev.has(productId)) return prev
      const next = new Set(prev)
      next.add(productId)
      return next
    })
    startTransition(async () => {
      try {
        const result = await addToCart(productId, 1)
        if (!result.error) {
          setAddedIds((prev) => new Set(prev).add(productId))
          setTimeout(() => {
            setAddedIds((prev) => {
              const next = new Set(prev)
              next.delete(productId)
              return next
            })
          }, 2000)
        }
      } finally {
        setAddingIds((prev) => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })
      }
    })
  }, [startTransition])

  const handleAddToCart = (productId: string) => {
    if (!isLoggedIn || userRole !== "buyer") {
      setShowSignInDialog(true)
      return
    }
    performAddToCart(productId)
  }

  const getSignInUrl = () =>
    `/sign-in?redirect_url=${encodeURIComponent("/about")}`

  const getSignUpUrl = () =>
    `/sign-up?redirect_url=${encodeURIComponent("/about")}`

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ===== HEADER WITH BACK BUTTON ===== */}
      <div className="mb-8">
        <Link href="/about">
          <Button variant="outline" size="sm" className="gap-1 mb-4">
            <ChevronLeft className="h-4 w-4" /> {t("backToHome")}
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">{t("matchingResults")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("matchingResultsDesc", { count: String(products.length) })}
        </p>
        {/* Summary of search criteria */}
        <div className="flex flex-wrap gap-2 mt-3">
          {category && (
            <Badge variant="secondary">{t("businessField")}: {category}</Badge>
          )}
          {subcategory && (
            <Badge variant="secondary">{t("productType")}: {subcategory}</Badge>
          )}
          {region && (
            <Badge variant="secondary">{t("region")}: {region}</Badge>
          )}
        </div>
      </div>

      {/* ===== PRODUCT GRID ===== */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {products.map((product) => (
            <Card key={product.id} className="group hover:shadow-md transition-all">
              <CardContent className="p-0">
                <Link href={isLoggedIn && userRole === "buyer" ? `/buyer/product/${product.id}` : `/product/${product.id}`}>
                  <div className="aspect-square relative bg-card rounded-t-xl flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                      />
                    ) : (
                      <Package className="h-10 w-10 text-muted-foreground/30" />
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Badge variant="secondary" className="text-xs mb-1">{product.category}</Badge>
                  <Link href={isLoggedIn && userRole === "buyer" ? `/buyer/product/${product.id}` : `/product/${product.id}`}>
                    <h3 className="font-semibold text-sm line-clamp-1 hover:underline">{product.name}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">{product.model_number}</p>
                  <p className="font-bold text-primary text-sm mt-2">
                    {formatDualPrice(product.price_per_meter, product.price_cny ?? null, product.pricing_type ?? "standard", rate)}
                  </p>
                  {product.seller_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("seller")}: {product.seller_name}
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant={addedIds.has(product.id) ? "default" : "outline"}
                    className="w-full mt-2 text-xs h-8"
                    onClick={() => handleAddToCart(product.id)}
                    disabled={addingIds.has(product.id) || product.stock <= 0}
                  >
                    {addingIds.has(product.id) ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : product.stock <= 0 ? (
                      tCart("outOfStock")
                    ) : addedIds.has(product.id) ? (
                      <><Check className="h-3 w-3 mr-1" />{tCart("addedToCart")}</>
                    ) : (
                      <><ShoppingCart className="h-3 w-3 mr-1" />{tCart("addToCart")}</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title={t("noMatchingProducts")}
          description={t("noMatchingProductsDesc")}
        />
      )}

      {/* ===== SIGN-IN DIALOG ===== */}
      <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("signInToContinue")}</DialogTitle>
            <DialogDescription>{t("signInToContinueDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowSignInDialog(false)}>
              {tCommon("cancel")}
            </Button>
            <Link href={getSignInUrl()}>
              <Button variant="outline" className="w-full sm:w-auto">
                {tNav("logIn")}
              </Button>
            </Link>
            <Link href={getSignUpUrl()}>
              <Button className="w-full sm:w-auto">
                {tNav("signUpFree")}
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
