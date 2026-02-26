"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import Link from "@/components/ui/link"
import Image from "next/image"
import { Package, Search, ShoppingCart, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import { MAIN_CATEGORIES } from "@/types/categories"
import type { Product } from "@/types/database"

export function AllProductsList({ products, initialSearch = "" }: { products: Product[]; initialSearch?: string }) {
  const t = useTranslations("catalog")
  const tCommon = useTranslations("common")
  const tChat = useTranslations("chat")
  const [search, setSearch] = useState(initialSearch)
  const [categoryFilter, setCategoryFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 12

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
        <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }} options={MAIN_CATEGORIES.map((c) => ({ value: c, label: c }))} placeholder={tCommon("allCategories")} className="w-full sm:w-56" />
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
                      <span className="font-bold text-primary">{formatCurrency(product.price_per_meter)}/m</span>
                      <div className="flex gap-1">
                        <Link href={`/buyer/product/${product.id}`}>
                          <Button size="sm" variant="ghost" title={tChat("chatWithSeller")}><MessageSquare className="h-3.5 w-3.5" /></Button>
                        </Link>
                        <Link href={`/buyer/product/${product.id}`}><Button size="sm" variant="outline"><ShoppingCart className="h-3.5 w-3.5 mr-1" /> {tCommon("add")}</Button></Link>
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
  )
}
