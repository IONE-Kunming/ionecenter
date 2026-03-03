"use client"

import { useState, useMemo, useTransition } from "react"
import { useTranslations } from "next-intl"
import Link from "@/components/ui/link"
import Image from "next/image"
import { Package, Search, ShoppingCart, MessageSquare, Check, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { WishlistButton } from "@/components/wishlist-button"
import { useToast } from "@/components/ui/toaster"
import { formatDualPrice } from "@/lib/utils"
import { useExchangeRate } from "@/lib/use-exchange-rate"
import { addToCart } from "@/lib/actions/cart"
import type { CategoryData } from "@/lib/categories"
import { toCategoryKey } from "@/lib/categories"
import type { Product } from "@/types/database"

export function AllProductsList({ products, initialSearch = "", categoryData, wishlistedIds = [] }: { products: Product[]; initialSearch?: string; categoryData: CategoryData; wishlistedIds?: string[] }) {
  const t = useTranslations("catalog")
  const tCommon = useTranslations("common")
  const tChat = useTranslations("chat")
  const tCart = useTranslations("cart")
  const tCatNames = useTranslations("categoryNames")
  const { rate } = useExchangeRate()
  const { addToast } = useToast()
  const [, startTransition] = useTransition()

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
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.model_number.toLowerCase().includes(search.toLowerCase())
      const matchCategory = !categoryFilter || p.main_category === categoryFilter
      return matchSearch && matchCategory
    })
  }, [products, search, categoryFilter])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} placeholder={tCommon("searchProducts")} className="pl-9" />
        </div>
        <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }} options={categoryData.mainCategories.map((c) => ({ value: c, label: translateCat(c) }))} placeholder={tCommon("allCategories")} className="w-full sm:w-56" />
      </div>

      {paginated.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map((product) => (
              <Card key={product.id} className="group hover:shadow-md transition-all">
                <CardContent className="p-0">
                  <Link href={`/buyer/product/${product.id}`}>
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
                    <Badge variant="secondary" className="text-xs mb-2">{product.category}</Badge>
                    <Link href={`/buyer/product/${product.id}`}>
                      <h3 className="font-semibold text-sm line-clamp-1 hover:underline">{product.name}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">{product.model_number}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-primary">{formatDualPrice(product.price_per_meter, product.price_cny, product.pricing_type, rate)}</span>
                      <div className="flex gap-1 items-center">
                        <WishlistButton productId={product.id} initialLiked={wishlistedIds.includes(product.id)} />
                        <Link href={`/buyer/product/${product.id}`}>
                          <Button size="sm" variant="ghost" title={tChat("chatWithSeller")}><MessageSquare className="h-3.5 w-3.5" /></Button>
                        </Link>
                        <Button
                          size="sm"
                          variant={addedIds.has(product.id) ? "default" : "outline"}
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
