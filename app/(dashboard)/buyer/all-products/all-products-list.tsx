"use client"

import { useState, useMemo, useTransition } from "react"
import { useTranslations } from "next-intl"
import Link from "@/components/ui/link"
import { Package, ShoppingCart, MessageSquare, Check, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { WishlistButton } from "@/components/wishlist-button"
import { ProductShareButton } from "@/components/product-share-button"
import { ProductImageCarousel } from "@/components/product-image-carousel"
import { useToast } from "@/components/ui/toaster"
import { formatDualPrice } from "@/lib/utils"
import { useExchangeRate } from "@/lib/use-exchange-rate"
import { addToCart } from "@/lib/actions/cart"
import { getOrCreateConversation } from "@/lib/actions/chat"
import type { CategoryData } from "@/lib/categories"
import { toCategoryKey } from "@/lib/categories"
import type { Product } from "@/types/database"
import { ProductSearchDropdown, matchesProductSearch } from "@/components/product-search-dropdown"

type ProductWithImages = Product & { images?: { image_url: string; is_primary: boolean }[] }

export function AllProductsList({ products, initialSearch = "", categoryData, wishlistedIds = [] }: { products: ProductWithImages[]; initialSearch?: string; categoryData: CategoryData; wishlistedIds?: string[] }) {
  const t = useTranslations("catalog")
  const tCommon = useTranslations("common")
  const tChat = useTranslations("chat")
  const tCart = useTranslations("cart")
  const tCatNames = useTranslations("categoryNames")
  const { rate } = useExchangeRate()
  const { addToast } = useToast()
  const [, startTransition] = useTransition()
  const [chattingIds, setChattingIds] = useState<Set<string>>(new Set())

  const translateCat = (name: string): string => {
    const key = toCategoryKey(name)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translated = (tCatNames as any)(key)
    return typeof translated === "string" && translated !== key ? translated : name
  }
  const [search, setSearch] = useState(initialSearch)
  const [categoryFilter, setCategoryFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [cartCount, setCartCount] = useState(0)
  const perPage = 12

  const handleChatWithSeller = (e: React.MouseEvent, product: Product) => {
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
  }

  const handleAddToCart = (productId: string) => {
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
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = matchesProductSearch(p, search)
      const matchCategory = !categoryFilter || p.main_category === categoryFilter
      return matchSearch && matchCategory
    })
  }, [products, search, categoryFilter])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <ProductSearchDropdown value={search} onChange={(v) => { setSearch(v); setCurrentPage(1) }} products={products} placeholder={tCommon("searchProducts")} linkPrefix="/buyer/product" className="flex-1" />
        <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }} options={categoryData.mainCategories.map((c) => ({ value: c, label: translateCat(c) }))} placeholder={tCommon("allCategories")} className="w-full sm:w-56" />
      </div>

      {paginated.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map((product) => (
              <Card key={product.id} className="group hover:shadow-md transition-all">
                <CardContent className="p-0">
                  <Link href={`/buyer/product/${product.id}`}>
                    <div className="aspect-square relative bg-card rounded-t-xl flex items-center justify-center overflow-hidden">
                      <ProductImageCarousel
                        images={product.images ?? []}
                        fallbackUrl={product.image_url}
                        alt={product.name}
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    <Badge variant="secondary" className="text-xs mb-2">{product.category}</Badge>
                    <Link href={`/buyer/product/${product.id}`}>
                      <h3 className="font-semibold text-sm line-clamp-1 hover:underline">{product.name}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">{product.model_number}</p>
                    <p className="font-bold text-primary mt-3">{formatDualPrice(product.price_per_meter, product.price_cny, product.pricing_type, rate)}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <WishlistButton productId={product.id} initialLiked={wishlistedIds.includes(product.id)} />
                      <ProductShareButton productName={product.name} modelNumber={product.model_number} price={product.price_per_meter} productId={product.id} />
                      <Button size="sm" variant="ghost" title={tChat("chatWithSeller")} onClick={(e) => handleChatWithSeller(e, product)} disabled={chattingIds.has(product.id)}>
                        {chattingIds.has(product.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
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
                          <><Check className="h-3.5 w-3.5 mr-1" /> {tCart("addedToCart")}</>
                        ) : (
                          <><ShoppingCart className="h-3.5 w-3.5 mr-1" /> {tCart("addToCart")}</>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      ) : (
        <EmptyState icon={Package} title={t("noProducts")} description={t("noProductsDesc")} />
      )}

      {/* Sticky Go to Cart overlay */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-primary px-6 py-3 shadow-lg text-primary-foreground">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-medium">{cartCount} {cartCount === 1 ? tCommon("item") : tCommon("items")}</span>
          <Link href="/buyer/cart">
            <Button size="sm" variant="secondary" className="rounded-full font-semibold">
              {tCart("goToCart")}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
