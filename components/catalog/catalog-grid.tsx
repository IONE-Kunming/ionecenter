"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search, Package } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { Select } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import { MAIN_CATEGORIES } from "@/types/categories"

interface CatalogProduct {
  id: string
  name: string
  model_number: string
  main_category: string
  category: string
  price_per_meter: number
  stock: number
  image_url: string | null
}

const ITEMS_PER_PAGE = 12

export function CatalogGrid({
  products,
  basePath = "/guest/product",
  showSignupCta = false,
}: {
  products: CatalogProduct[]
  basePath?: string
  showSignupCta?: boolean
}) {
  const searchParams = useSearchParams()
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
            placeholder="Search products..."
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }}
          options={MAIN_CATEGORIES.map((c) => ({ value: c, label: c }))}
          placeholder="All Categories"
          className="w-full sm:w-56"
        />
      </div>

      {/* Products Grid */}
      {paginatedProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedProducts.map((product) => (
              <Link key={product.id} href={`${basePath}/${product.id}`}>
                <Card className="group hover:shadow-md transition-all cursor-pointer h-full">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-t-xl flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground/30" />
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
                          {formatCurrency(product.price_per_meter)}/m
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Stock: {product.stock}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
          title="No products found"
          description="Try adjusting your search or filter criteria."
        />
      )}

      {showSignupCta && (
        <div className="mt-8 text-center p-6 rounded-xl bg-primary/5 border">
          <p className="font-medium">Want to purchase these products?</p>
          <p className="text-sm text-muted-foreground mt-1">Create a free account to add items to cart and place orders.</p>
          <Link href="/sign-up">
            <Button className="mt-3">Sign Up to Purchase</Button>
          </Link>
        </div>
      )}
    </>
  )
}
