"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import Link from "@/components/ui/link"
import { useSearchParams } from "next/navigation"
import { Search, Package } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { Select } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { ProductImageCarousel } from "@/components/product-image-carousel"
import { formatDualPrice } from "@/lib/utils"
import { useExchangeRate } from "@/lib/use-exchange-rate"
import type { CategoryData } from "@/lib/categories"
import { toCategoryKey } from "@/lib/categories"
import type { PricingType } from "@/types/database"

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
  image_url: string | null
  images?: { image_url: string; is_primary: boolean }[]
}

const ITEMS_PER_PAGE = 12

export function CatalogGrid({
  products,
  basePath = "/product",
  showSignupCta = false,
  categoryData,
}: {
  products: CatalogProduct[]
  basePath?: string
  showSignupCta?: boolean
  categoryData: CategoryData
}) {
  const searchParams = useSearchParams()
  const t = useTranslations("catalog")
  const tCommon = useTranslations("common")
  const tCatNames = useTranslations("categoryNames")
  const { rate } = useExchangeRate()

  const translateCat = (name: string): string => {
    const key = toCategoryKey(name)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translated = (tCatNames as any)(key)
    return typeof translated === "string" && translated !== key ? translated : name
  }
  const initialCategory = searchParams.get("category") || ""
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState(initialCategory)
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.model_number.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !categoryFilter || p.main_category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [products, search, categoryFilter])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            placeholder={tCommon("searchProducts")}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }}
          options={categoryData.mainCategories.map((c) => ({ value: c, label: translateCat(c) }))}
          placeholder={tCommon("allCategories")}
          className="w-full sm:w-56"
        />
      </div>

      {/* Products Grid */}
      {paginatedProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedProducts.map((product) => {
              return (
                <Link key={product.id} href={`${basePath}/${product.id}`}>
                  <Card className="group hover:shadow-md transition-all cursor-pointer h-full">
                    <CardContent className="p-0">
                      <div className="aspect-square relative bg-card rounded-t-xl flex items-center justify-center overflow-hidden">
                        <ProductImageCarousel
                          images={product.images ?? []}
                          alt={product.name}
                        />
                      </div>
                      <div className="p-4">
                        <Badge variant="secondary" className="text-xs mb-2">
                          {product.category}
                        </Badge>
                        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">{product.model_number}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-bold text-primary">
                            {formatDualPrice(product.price_per_meter, product.price_cny ?? null, product.pricing_type ?? "standard", rate)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t("stockLabel")} {product.stock}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-8"
          />
        </>
      ) : (
        <EmptyState
          icon={Package}
          title={t("noProducts")}
          description={t("noProductsDesc")}
        />
      )}

      {showSignupCta && (
        <div className="mt-8 text-center p-6 rounded-xl bg-primary/5 border">
          <p className="font-medium">{t("wantToPurchase")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("createFreeAccount")}</p>
          <Link href="/sign-up">
            <Button className="mt-3">{t("signUpToPurchase")}</Button>
          </Link>
        </div>
      )}
    </>
  )
}
