"use client"

import { useState, useMemo, useTransition, useCallback } from "react"
import { useTranslations } from "next-intl"
import Link from "@/components/ui/link"
import Image from "next/image"
import {
  Package,
  ArrowLeft,
  ShoppingCart,
  MessageSquare,
  Check,
  Loader2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { WishlistButton } from "@/components/wishlist-button"
import { useToast } from "@/components/ui/toaster"
import { formatDualPrice } from "@/lib/utils"
import { useExchangeRate } from "@/lib/use-exchange-rate"
import { addToCart } from "@/lib/actions/cart"
import { getOrCreateConversation } from "@/lib/actions/chat"
import type { CategoryData } from "@/lib/categories"
import { toCategoryKey } from "@/lib/categories"
import type { PricingType } from "@/types/database"
import {
  ProductSearchDropdown,
  matchesProductSearch,
} from "@/components/product-search-dropdown"

interface CatalogProduct {
  id: string
  name: string
  model_number: string
  main_category: string
  category: string
  price_per_meter: number
  pricing_type?: PricingType
  price_cny?: number | null
  stock: number
  seller_id: string
  seller_name: string
  image_url: string | null
}

const ITEMS_PER_PAGE = 12

const SUBCATEGORY_BADGE_ABSOLUTE =
  "absolute top-2 left-2 z-10 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md text-[10px]"

export function SubcategoriesClient({
  categoryName,
  products,
  categoryData,
  wishlistedIds = [],
}: {
  categoryName: string
  products: CatalogProduct[]
  categoryData: CategoryData
  wishlistedIds?: string[]
}) {
  const t = useTranslations("catalog")
  const tCommon = useTranslations("common")
  const tChat = useTranslations("chat")
  const tCart = useTranslations("cart")
  const tCatNames = useTranslations("categoryNames")
  const { rate } = useExchangeRate()
  const { addToast } = useToast()
  const [, startTransition] = useTransition()
  const [chattingIds, setChattingIds] = useState<Set<string>>(new Set())

  const [showCategoryNumbers, setShowCategoryNumbers] = useState(true)
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [cartCount, setCartCount] = useState(0)

  const translateCat = (name: string): string => {
    const key = toCategoryKey(name)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translated = (tCatNames as any)(key)
    return typeof translated === "string" && translated !== key
      ? translated
      : name
  }

  const parentIdx = categoryData.mainCategories.indexOf(categoryName) + 1
  const subcategories = categoryData.categoryMap[categoryName] ?? []

  const handleChatWithSeller = useCallback(
    (e: React.MouseEvent, product: CatalogProduct) => {
      e.stopPropagation()
      e.preventDefault()
      if (chattingIds.has(product.id)) return
      setChattingIds((prev) => new Set(prev).add(product.id))
      startTransition(async () => {
        try {
          const conversation = await getOrCreateConversation(product.seller_id)
          if (conversation) {
            window.location.href = `/buyer/chats?id=${conversation.id}`
          } else {
            addToast("error", tChat("chatWithSeller"))
          }
        } catch {
          addToast("error", tChat("chatWithSeller"))
        } finally {
          setChattingIds((prev) => {
            const next = new Set(prev)
            next.delete(product.id)
            return next
          })
        }
      })
    },
    [chattingIds, startTransition, addToast, tChat]
  )

  const handleAddToCart = useCallback(
    (productId: string) => {
      if (addingIds.has(productId)) return
      setAddingIds((prev) => new Set(prev).add(productId))
      startTransition(async () => {
        try {
          const result = await addToCart(productId, 1)
          if (!result.error) {
            setAddedIds((prev) => new Set(prev).add(productId))
            setCartCount((c) => c + 1)
            setTimeout(() => {
              setAddedIds((prev) => {
                const next = new Set(prev)
                next.delete(productId)
                return next
              })
            }, 2000)
          } else {
            addToast("error", result.error)
          }
        } finally {
          setAddingIds((prev) => {
            const next = new Set(prev)
            next.delete(productId)
            return next
          })
        }
      })
    },
    [addingIds, startTransition, addToast]
  )

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = p.main_category === categoryName
      const matchesSub = !selectedSubcategory || p.category === selectedSubcategory
      const matchesSearch = matchesProductSearch(p, search)
      return matchesCategory && matchesSub && matchesSearch
    })
  }, [products, categoryName, selectedSubcategory, search])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Show products view when a subcategory is selected
  if (selectedSubcategory) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/buyer/categories"
            className="text-muted-foreground hover:text-foreground"
          >
            {t("categoriesLabel")}
          </Link>
          <span className="text-muted-foreground">›</span>
          <button
            onClick={() => {
              setSelectedSubcategory("")
              setCurrentPage(1)
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            {translateCat(categoryName)}
          </button>
          <span className="text-muted-foreground">›</span>
          <span className="font-medium">{translateCat(selectedSubcategory)}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedSubcategory("")
            setCurrentPage(1)
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> {tCommon("back")}
        </Button>

        <ProductSearchDropdown
          value={search}
          onChange={(v) => {
            setSearch(v)
            setCurrentPage(1)
          }}
          products={products}
          placeholder={tCommon("searchProducts")}
          linkPrefix="/buyer/product"
          className="max-w-md"
        />

        {paginatedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-md transition-all">
                  <CardContent className="p-0">
                    <Link href={`/buyer/product/${product.id}`}>
                      <div className="aspect-square relative bg-card rounded-t-xl flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        ) : (
                          <Package className="h-12 w-12 text-muted-foreground/30" />
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Badge variant="secondary" className="text-xs mb-2">
                        {product.category}
                      </Badge>
                      <Link href={`/buyer/product/${product.id}`}>
                        <h3 className="font-semibold text-sm line-clamp-1 hover:underline">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">
                        {product.model_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.seller_name}
                      </p>
                      <p className="font-bold text-primary mt-3">
                        {formatDualPrice(
                          product.price_per_meter,
                          product.price_cny ?? null,
                          product.pricing_type ?? "standard",
                          rate
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <WishlistButton
                          productId={product.id}
                          initialLiked={wishlistedIds.includes(product.id)}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          title={tChat("chatWithSeller")}
                          onClick={(e) => handleChatWithSeller(e, product)}
                          disabled={chattingIds.has(product.id)}
                        >
                          {chattingIds.has(product.id) ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MessageSquare className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant={addedIds.has(product.id) ? "default" : "outline"}
                          className="ml-auto"
                          onClick={() => handleAddToCart(product.id)}
                          disabled={addingIds.has(product.id) || product.stock <= 0}
                        >
                          {addingIds.has(product.id) ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : product.stock <= 0 ? (
                            tCart("outOfStock")
                          ) : addedIds.has(product.id) ? (
                            <>
                              <Check className="h-3.5 w-3.5 mr-1" />{" "}
                              {tCart("addedToCart")}
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-3.5 w-3.5 mr-1" />{" "}
                              {tCart("addToCart")}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <EmptyState
            icon={Package}
            title={t("noProducts")}
            description={t("noProductsDesc")}
          />
        )}

        {/* Sticky Go to Cart overlay */}
        {cartCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-primary px-6 py-3 shadow-lg text-primary-foreground">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-medium">
              {cartCount} {cartCount === 1 ? tCommon("item") : tCommon("items")}
            </span>
            <Link href="/buyer/cart">
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full font-semibold"
              >
                {tCart("goToCart")}
              </Button>
            </Link>
          </div>
        )}
      </div>
    )
  }

  // Subcategories grid view
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/buyer/categories"
          className="text-muted-foreground hover:text-foreground"
        >
          {t("categoriesLabel")}
        </Link>
        <span className="text-muted-foreground">›</span>
        <span className="font-medium">{translateCat(categoryName)}</span>
      </div>

      <Link href="/buyer/categories">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" /> {tCommon("back")}
        </Button>
      </Link>

      <div className="flex justify-end items-center gap-2">
        <Label htmlFor="showSubNumbers" className="text-sm">
          {t("showNumbers")}
        </Label>
        <Switch
          id="showSubNumbers"
          checked={showCategoryNumbers}
          onCheckedChange={setShowCategoryNumbers}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {subcategories.map((sub, subIdx) => {
          const subcategoryCode = `${parentIdx}:${subIdx + 1}`
          const subImageUrl = categoryData.categoryImageMap[sub] ?? null
          return (
            <Card
              key={sub}
              className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden"
              onClick={() => {
                setSelectedSubcategory(sub)
                setCurrentPage(1)
              }}
            >
              <CardContent className="p-0">
                {subImageUrl ? (
                  <div className="relative h-[120px]">
                    {showCategoryNumbers && (
                      <div
                        className={SUBCATEGORY_BADGE_ABSOLUTE}
                        aria-label={`Subcategory ${subcategoryCode}`}
                      >
                        {subcategoryCode}
                      </div>
                    )}
                    <Image
                      src={subImageUrl}
                      alt={translateCat(sub)}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3">
                      <h3 className="font-semibold text-sm text-white">
                        {translateCat(sub)}
                      </h3>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center relative">
                    {showCategoryNumbers && (
                      <div
                        className={SUBCATEGORY_BADGE_ABSOLUTE}
                        aria-label={`Subcategory ${subcategoryCode}`}
                      >
                        {subcategoryCode}
                      </div>
                    )}
                    <Package className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="mt-2 font-semibold text-sm">
                      {translateCat(sub)}
                    </h3>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {subcategories.length === 0 && (
        <EmptyState
          icon={Package}
          title={t("noProducts")}
          description={t("noProductsDesc")}
        />
      )}
    </div>
  )
}
