"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import Link from "@/components/ui/link"
import Image from "next/image"
import { Package, ArrowLeft, ShoppingCart, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { ProductImageCarousel } from "@/components/product-image-carousel"
import { ProductShareButton } from "@/components/product-share-button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { formatDualPrice } from "@/lib/utils"
import { useExchangeRate } from "@/lib/use-exchange-rate"
import type { CategoryData } from "@/lib/categories"
import { toCategoryKey } from "@/lib/categories"
import type { PricingType } from "@/types/database"
import { ProductSearchDropdown, matchesProductSearch } from "@/components/product-search-dropdown"

type BrowseLevel = "categories" | "subcategories" | "products"

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
  seller_name: string
  image_url: string | null
  images?: { image_url: string; is_primary: boolean }[]
}

const ITEMS_PER_PAGE = 12

const CATEGORY_BADGE_BASE = "rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md"
const CATEGORY_BADGE_ABSOLUTE = `absolute top-2 left-2 z-10 w-8 h-8 ${CATEGORY_BADGE_BASE}`
const SUBCATEGORY_BADGE_ABSOLUTE = `absolute top-2 left-2 z-10 w-8 h-8 ${CATEGORY_BADGE_BASE} text-[10px]`

export function GuestCatalogBrowser({ products, categoryData }: { products: CatalogProduct[]; categoryData: CategoryData }) {
  const t = useTranslations("catalog")
  const tCommon = useTranslations("common")
  const tCatNames = useTranslations("categoryNames")
  const tNav = useTranslations("nav")
  const tCategories = useTranslations("categories")
  const { rate } = useExchangeRate()

  const [signInOpen, setSignInOpen] = useState(false)

  const translateCat = (name: string): string => {
    const key = toCategoryKey(name)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translated = (tCatNames as any)(key)
    return typeof translated === "string" && translated !== key ? translated : name
  }

  const [level, setLevel] = useState<BrowseLevel>("categories")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showCategoryNumbers, setShowCategoryNumbers] = useState(true)

  const productCountsBySubcategory = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of products) {
      if (p.category) {
        counts[p.category] = (counts[p.category] ?? 0) + 1
      }
    }
    return counts
  }, [products])

  const categoryIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    categoryData.mainCategories.forEach((cat, idx) => map.set(cat, idx))
    return map
  }, [categoryData.mainCategories])

  const breadcrumb = useMemo(() => {
    const items = [{ label: t("categoriesLabel"), onClick: () => { setLevel("categories"); setSelectedCategory(""); setSelectedSubcategory("") } }]
    if (selectedCategory) {
      items.push({ label: translateCat(selectedCategory), onClick: () => { setLevel("subcategories"); setSelectedSubcategory("") } })
    }
    if (selectedSubcategory) {
      items.push({ label: translateCat(selectedSubcategory), onClick: () => {} })
    }
    return items
  }, [selectedCategory, selectedSubcategory, t]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = !selectedCategory || p.main_category === selectedCategory
      const matchesSubcategory = !selectedSubcategory || p.category === selectedSubcategory
      const matchesSearch = matchesProductSearch(p, search)
      return matchesCategory && matchesSubcategory && matchesSearch
    })
  }, [products, selectedCategory, selectedSubcategory, search])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{tCategories("title")}</h1>
        <p className="mt-2 text-muted-foreground">{tCategories("guestSubtitle")}</p>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumb.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground">›</span>}
            <button onClick={item.onClick} className={i < breadcrumb.length - 1 ? "text-muted-foreground hover:text-foreground" : "font-medium"}>
              {item.label}
            </button>
          </span>
        ))}
      </div>

      {/* Category Grid */}
      {level === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-end items-center gap-2">
            <Label htmlFor="showNumbers" className="text-sm">{t("showNumbers")}</Label>
            <Switch id="showNumbers" checked={showCategoryNumbers} onCheckedChange={setShowCategoryNumbers} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryData.mainCategories.map((cat) => {
              const subcategories = categoryData.categoryMap[cat] ?? []
              const categoryCode = String((categoryIndexMap.get(cat) ?? 0) + 1).padStart(2, '0')
              const imageUrl = categoryData.categoryImageMap[cat] ?? null
              return (
                <Card
                  key={cat}
                  className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden"
                  onClick={() => { setSelectedCategory(cat); setLevel("subcategories"); setCurrentPage(1) }}
                >
                  <CardContent className="p-0 relative">
                    {imageUrl ? (
                      <div className="relative h-[160px]">
                        {showCategoryNumbers && (
                          <div className={`${CATEGORY_BADGE_ABSOLUTE} text-xs`} aria-label={`Category ${categoryCode}`}>
                            {categoryCode}
                          </div>
                        )}
                        <Image
                          src={imageUrl}
                          alt={cat}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4">
                          <h3 className="font-semibold text-white">{translateCat(cat)}</h3>
                          <p className="text-sm text-white/80">
                            {subcategories.length} {t("subcategories")}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center relative">
                        {showCategoryNumbers && (
                          <div className={`${CATEGORY_BADGE_ABSOLUTE} text-xs`} aria-label={`Category ${categoryCode}`}>
                            {categoryCode}
                          </div>
                        )}
                        <Package className="h-10 w-10 mx-auto text-primary" />
                        <h3 className="mt-4 font-semibold text-base">{translateCat(cat)}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {subcategories.length} {t("subcategories")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {categoryData.mainCategories.length === 0 && (
            <EmptyState icon={Package} title={t("noCategoriesFound")} description={t("noCategoriesFoundDesc")} />
          )}
        </div>
      )}

      {/* Subcategory Grid */}
      {level === "subcategories" && selectedCategory && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => { setLevel("categories"); setSelectedCategory("") }}>
            <ArrowLeft className="h-4 w-4 mr-2" /> {tCommon("back")}
          </Button>
          <div className="flex justify-end items-center gap-2">
            <Label htmlFor="showSubNumbers" className="text-sm">{t("showNumbers")}</Label>
            <Switch id="showSubNumbers" checked={showCategoryNumbers} onCheckedChange={setShowCategoryNumbers} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(categoryData.categoryMap[selectedCategory] ?? []).map((sub, subIdx) => {
              const parentIdx = categoryData.mainCategories.indexOf(selectedCategory) + 1
              const subcategoryCode = `${parentIdx}:${subIdx + 1}`
              const subImageUrl = categoryData.categoryImageMap[sub] ?? null
              return (
                <Card
                  key={sub}
                  className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden"
                  onClick={() => { setSelectedSubcategory(sub); setLevel("products"); setCurrentPage(1) }}
                >
                  <CardContent className="p-0">
                    {subImageUrl ? (
                      <div className="relative h-[120px]">
                        {showCategoryNumbers && (
                          <div className={SUBCATEGORY_BADGE_ABSOLUTE} aria-label={`Subcategory ${subcategoryCode}`}>
                            {subcategoryCode}
                          </div>
                        )}
                        <Image
                          src={subImageUrl}
                          alt={sub}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <h3 className="font-semibold text-sm text-white">{translateCat(sub)}</h3>
                          <p className="text-xs text-white/80">
                            {productCountsBySubcategory[sub] ?? 0} {t("productsLabel")}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center relative">
                        {showCategoryNumbers && (
                          <div className={SUBCATEGORY_BADGE_ABSOLUTE} aria-label={`Subcategory ${subcategoryCode}`}>
                            {subcategoryCode}
                          </div>
                        )}
                        <Package className="h-8 w-8 mx-auto text-primary" />
                        <h3 className="mt-2 font-semibold text-sm">{translateCat(sub)}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {productCountsBySubcategory[sub] ?? 0} {t("productsLabel")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Product Grid */}
      {level === "products" && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => { setLevel("subcategories"); setSelectedSubcategory("") }}>
            <ArrowLeft className="h-4 w-4 mr-2" /> {tCommon("back")}
          </Button>
          <ProductSearchDropdown value={search} onChange={(v) => { setSearch(v); setCurrentPage(1) }} products={products} placeholder={tCommon("searchProducts")} linkPrefix="/product" className="max-w-md" />
          {paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedProducts.map((product) => (
                  <Card key={product.id} className="group hover:shadow-md transition-all">
                    <CardContent className="p-0">
                      <Link href={`/product/${product.id}`}>
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
                        <Link href={`/product/${product.id}`}>
                          <h3 className="font-semibold text-sm line-clamp-1 hover:underline">{product.name}</h3>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-1">{product.model_number}</p>
                        <p className="text-xs text-muted-foreground">{product.seller_name}</p>
                        <p className="font-bold text-primary mt-3">{formatDualPrice(product.price_per_meter, product.price_cny ?? null, product.pricing_type ?? "standard", rate)}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSignInOpen(true) }}
                            className="inline-flex items-center justify-center rounded-full bg-gray-900/80 dark:bg-gray-800/90 transition-all h-7 w-7 hover:bg-gray-900 dark:hover:bg-gray-700"
                            aria-label="Add to wishlist"
                          >
                            <Heart className="h-3.5 w-3.5 text-white" />
                          </button>
                          <ProductShareButton productName={product.name} modelNumber={product.model_number} price={product.price_per_meter} productId={product.id} />
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-auto"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSignInOpen(true) }}
                          >
                            <ShoppingCart className="h-3.5 w-3.5 mr-1" /> {t("addToCart")}
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
        </div>
      )}

      {/* Signup CTA */}
      <div className="mt-8 text-center p-6 rounded-xl bg-primary/5 border">
        <p className="font-medium">{t("wantToPurchase")}</p>
        <p className="text-sm text-muted-foreground mt-1">{t("createFreeAccount")}</p>
        <Link href="/sign-up">
          <Button className="mt-3">{t("signUpToPurchase")}</Button>
        </Link>
      </div>

      {/* Sign-in required dialog */}
      <Dialog open={signInOpen} onOpenChange={setSignInOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("signInRequired")}</DialogTitle>
            <DialogDescription>{t("signInRequiredDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setSignInOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Link href="/sign-in">
              <Button variant="outline" className="w-full sm:w-auto">
                {tNav("logIn")}
              </Button>
            </Link>
            <Link href="/sign-up">
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
