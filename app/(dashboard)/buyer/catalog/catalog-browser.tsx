"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import Image from "next/image"
import { Package, ArrowLeft, Search, ShoppingCart, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import { CATEGORIES, MAIN_CATEGORIES } from "@/types/categories"
import { getCategoryImage, getSubcategoryImage } from "@/lib/constants/category-images"

type BrowseLevel = "categories" | "subcategories" | "products"

interface CatalogProduct {
  id: string
  name: string
  model_number: string
  main_category: string
  category: string
  price_per_meter: number
  stock: number
  seller_name: string
  image_url: string | null
}

const ITEMS_PER_PAGE = 12

export function BuyerCatalogBrowser({ products }: { products: CatalogProduct[] }) {
  const t = useTranslations("catalog")
  const tCommon = useTranslations("common")
  const tChat = useTranslations("chat")
  const [level, setLevel] = useState<BrowseLevel>("categories")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const breadcrumb = useMemo(() => {
    const items = [{ label: t("categoriesLabel"), onClick: () => { setLevel("categories"); setSelectedCategory(""); setSelectedSubcategory("") } }]
    if (selectedCategory) {
      items.push({ label: selectedCategory, onClick: () => { setLevel("subcategories"); setSelectedSubcategory("") } })
    }
    if (selectedSubcategory) {
      items.push({ label: selectedSubcategory, onClick: () => {} })
    }
    return items
  }, [selectedCategory, selectedSubcategory])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = !selectedCategory || p.main_category === selectedCategory
      const matchesSubcategory = !selectedSubcategory || p.category === selectedSubcategory
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.model_number.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSubcategory && matchesSearch
    })
  }, [products, selectedCategory, selectedSubcategory, search])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MAIN_CATEGORIES.map((cat) => {
            const imageUrl = getCategoryImage(cat)
            return (
            <Card
              key={cat}
              className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden"
              onClick={() => { setSelectedCategory(cat); setLevel("subcategories"); setCurrentPage(1) }}
            >
              <CardContent className="p-0">
                {imageUrl ? (
                  <div className="relative h-[200px]">
                    <Image
                      src={imageUrl}
                      alt={cat}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5 text-center">
                      <h3 className="font-semibold text-base text-white">{cat}</h3>
                      <p className="text-sm text-white/80 mt-1">
                        {CATEGORIES[cat]?.subcategories.length || 0} {t("subcategories")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Package className="h-10 w-10 mx-auto text-primary" />
                    <h3 className="mt-4 font-semibold text-base">{cat}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {CATEGORIES[cat]?.subcategories.length || 0} {t("subcategories")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}

      {/* Subcategory Grid */}
      {level === "subcategories" && selectedCategory && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => { setLevel("categories"); setSelectedCategory("") }}>
            <ArrowLeft className="h-4 w-4 mr-2" /> {tCommon("back")}
          </Button>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES[selectedCategory]?.subcategories.map((sub) => {
              const subImageUrl = getSubcategoryImage(sub)
              return (
              <Card
                key={sub}
                className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden"
                onClick={() => { setSelectedSubcategory(sub); setLevel("products"); setCurrentPage(1) }}
              >
                <CardContent className="p-0">
                  {subImageUrl ? (
                    <div className="relative h-[160px]">
                      <Image
                        src={subImageUrl}
                        alt={sub}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 text-center">
                        <h3 className="font-semibold text-sm text-white">{sub}</h3>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <Package className="h-8 w-8 mx-auto text-primary" />
                      <h3 className="mt-2 font-semibold text-sm">{sub}</h3>
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
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} placeholder={tCommon("searchProducts")} className="pl-9" />
          </div>
          {paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedProducts.map((product) => (
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
                        <p className="text-xs text-muted-foreground">{product.seller_name}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-bold text-primary">{formatCurrency(product.price_per_meter)}/m</span>
                          <div className="flex gap-1">
                            <Link href={`/buyer/product/${product.id}`}>
                              <Button size="sm" variant="ghost" title={tChat("chatWithSeller")}><MessageSquare className="h-3.5 w-3.5" /></Button>
                            </Link>
                            <Button size="sm" variant="outline">
                              <ShoppingCart className="h-3.5 w-3.5 mr-1" /> {tCommon("add")}
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
        </div>
      )}
    </div>
  )
}
