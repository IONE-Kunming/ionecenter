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

// Demo products for guest browsing
const demoProducts = [
  { id: "1", name: "Premium Window Profile", model_number: "WP-6063-T5", main_category: "Aluminum Profiles", category: "Window & Door Profiles", price_per_meter: 12.50, stock: 500, image_url: null },
  { id: "2", name: "Curtain Wall Section", model_number: "CW-100-A", main_category: "Aluminum Profiles", category: "Curtain Wall Profiles", price_per_meter: 28.00, stock: 350, image_url: null },
  { id: "3", name: "Industrial T-Slot Profile", model_number: "TS-4040-V2", main_category: "Aluminum Profiles", category: "Industrial Profiles", price_per_meter: 8.75, stock: 1200, image_url: null },
  { id: "4", name: "Coated Aluminum Sheet 3mm", model_number: "AS-3MM-PE", main_category: "Aluminum Sheets", category: "Coated Sheets", price_per_meter: 45.00, stock: 800, image_url: null },
  { id: "5", name: "Tempered Glass Panel 10mm", model_number: "TG-10-CLR", main_category: "Glass Products", category: "Tempered Glass", price_per_meter: 65.00, stock: 200, image_url: null },
  { id: "6", name: "Door Handle Set Chrome", model_number: "DH-CHR-01", main_category: "Hardware & Accessories", category: "Handles & Locks", price_per_meter: 35.00, stock: 450, image_url: null },
  { id: "7", name: "Decorative Aluminum Profile", model_number: "DP-ART-03", main_category: "Aluminum Profiles", category: "Decorative Profiles", price_per_meter: 18.50, stock: 300, image_url: null },
  { id: "8", name: "Composite Panel 4mm", model_number: "CP-4MM-WH", main_category: "Aluminum Sheets", category: "Composite Panels", price_per_meter: 55.00, stock: 600, image_url: null },
  { id: "9", name: "Laminated Glass 8mm", model_number: "LG-8-CLR", main_category: "Glass Products", category: "Laminated Glass", price_per_meter: 52.00, stock: 250, image_url: null },
  { id: "10", name: "EPDM Rubber Seal", model_number: "SG-EPDM-01", main_category: "Hardware & Accessories", category: "Seals & Gaskets", price_per_meter: 3.50, stock: 5000, image_url: null },
  { id: "11", name: "Steel I-Beam 200mm", model_number: "SB-200-H", main_category: "Steel Products", category: "Steel Beams", price_per_meter: 85.00, stock: 100, image_url: null },
  { id: "12", name: "Thermal Insulation Board", model_number: "TI-50-XPS", main_category: "Insulation Materials", category: "Thermal Insulation", price_per_meter: 22.00, stock: 700, image_url: null },
]

const ITEMS_PER_PAGE = 12

export default function GuestCatalogPage() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") || ""
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState(initialCategory)
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    return demoProducts.filter((p) => {
      const matchesSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.model_number.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !categoryFilter || p.main_category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [search, categoryFilter])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Product Catalog</h1>
        <p className="mt-2 text-muted-foreground">
          Browse our selection of construction materials. Sign up to purchase.
        </p>
      </div>

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
              <Link key={product.id} href={`/guest/product/${product.id}`}>
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

      {/* Signup CTA */}
      <div className="mt-8 text-center p-6 rounded-xl bg-primary/5 border">
        <p className="font-medium">Want to purchase these products?</p>
        <p className="text-sm text-muted-foreground mt-1">Create a free account to add items to cart and place orders.</p>
        <Link href="/sign-up">
          <Button className="mt-3">Sign Up to Purchase</Button>
        </Link>
      </div>
    </div>
  )
}
