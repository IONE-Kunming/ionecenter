"use client"

import { useState, useMemo } from "react"
import { Package, Search, ShoppingCart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import { MAIN_CATEGORIES } from "@/types/categories"

const allProducts = [
  { id: "1", name: "Premium Window Profile", model_number: "WP-6063-T5", main_category: "Aluminum Profiles", category: "Window & Door Profiles", price_per_meter: 12.50, stock: 500 },
  { id: "2", name: "Curtain Wall Section", model_number: "CW-100-A", main_category: "Aluminum Profiles", category: "Curtain Wall Profiles", price_per_meter: 28.00, stock: 350 },
  { id: "3", name: "Industrial T-Slot Profile", model_number: "TS-4040-V2", main_category: "Aluminum Profiles", category: "Industrial Profiles", price_per_meter: 8.75, stock: 1200 },
  { id: "4", name: "Coated Aluminum Sheet 3mm", model_number: "AS-3MM-PE", main_category: "Aluminum Sheets", category: "Coated Sheets", price_per_meter: 45.00, stock: 800 },
  { id: "5", name: "Tempered Glass Panel 10mm", model_number: "TG-10-CLR", main_category: "Glass Products", category: "Tempered Glass", price_per_meter: 65.00, stock: 200 },
  { id: "6", name: "Door Handle Set Chrome", model_number: "DH-CHR-01", main_category: "Hardware & Accessories", category: "Handles & Locks", price_per_meter: 35.00, stock: 450 },
]

export default function AllProductsPage() {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 12

  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.model_number.toLowerCase().includes(search.toLowerCase())
      const matchCategory = !categoryFilter || p.main_category === categoryFilter
      return matchSearch && matchCategory
    })
  }, [search, categoryFilter])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} placeholder="Search products..." className="pl-9" />
        </div>
        <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }} options={MAIN_CATEGORIES.map((c) => ({ value: c, label: c }))} placeholder="All Categories" className="w-full sm:w-56" />
      </div>

      {paginated.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map((product) => (
              <Card key={product.id} className="group hover:shadow-md transition-all">
                <CardContent className="p-0">
                  <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-t-xl flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                  <div className="p-4">
                    <Badge variant="secondary" className="text-xs mb-2">{product.category}</Badge>
                    <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{product.model_number}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-primary">{formatCurrency(product.price_per_meter)}/m</span>
                      <Button size="sm" variant="outline"><ShoppingCart className="h-3.5 w-3.5 mr-1" /> Add</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      ) : (
        <EmptyState icon={Package} title="No products found" description="Try adjusting your search or filter." />
      )}
    </div>
  )
}
