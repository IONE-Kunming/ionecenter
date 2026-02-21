"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Package, ArrowLeft, Search, ShoppingCart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import { CATEGORIES, MAIN_CATEGORIES } from "@/types/categories"

type BrowseLevel = "categories" | "subcategories" | "products"

// Demo products
const demoProducts = [
  { id: "1", name: "Premium Window Profile", model_number: "WP-6063-T5", main_category: "Aluminum Profiles", category: "Window & Door Profiles", price_per_meter: 12.50, stock: 500, seller_name: "Kunming Aluminum Co." },
  { id: "2", name: "Curtain Wall Section", model_number: "CW-100-A", main_category: "Aluminum Profiles", category: "Curtain Wall Profiles", price_per_meter: 28.00, stock: 350, seller_name: "Kunming Aluminum Co." },
  { id: "3", name: "Industrial T-Slot Profile", model_number: "TS-4040-V2", main_category: "Aluminum Profiles", category: "Industrial Profiles", price_per_meter: 8.75, stock: 1200, seller_name: "Kunming Aluminum Co." },
  { id: "4", name: "Coated Aluminum Sheet 3mm", model_number: "AS-3MM-PE", main_category: "Aluminum Sheets", category: "Coated Sheets", price_per_meter: 45.00, stock: 800, seller_name: "Gulf Aluminum Industries" },
  { id: "5", name: "Tempered Glass Panel 10mm", model_number: "TG-10-CLR", main_category: "Glass Products", category: "Tempered Glass", price_per_meter: 65.00, stock: 200, seller_name: "Gulf Aluminum Industries" },
  { id: "6", name: "Door Handle Set Chrome", model_number: "DH-CHR-01", main_category: "Hardware & Accessories", category: "Handles & Locks", price_per_meter: 35.00, stock: 450, seller_name: "Kunming Aluminum Co." },
]

const ITEMS_PER_PAGE = 12

export default function BuyerCatalogPage() {
  const [level, setLevel] = useState<BrowseLevel>("categories")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const breadcrumb = useMemo(() => {
    const items = [{ label: "Categories", onClick: () => { setLevel("categories"); setSelectedCategory(""); setSelectedSubcategory("") } }]
    if (selectedCategory) {
      items.push({ label: selectedCategory, onClick: () => { setLevel("subcategories"); setSelectedSubcategory("") } })
    }
    if (selectedSubcategory) {
      items.push({ label: selectedSubcategory, onClick: () => {} })
    }
    return items
  }, [selectedCategory, selectedSubcategory])

  const filteredProducts = useMemo(() => {
    return demoProducts.filter((p) => {
      const matchesCategory = !selectedCategory || p.main_category === selectedCategory
      const matchesSubcategory = !selectedSubcategory || p.category === selectedSubcategory
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.model_number.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSubcategory && matchesSearch
    })
  }, [selectedCategory, selectedSubcategory, search])

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {MAIN_CATEGORIES.map((cat) => (
            <Card
              key={cat}
              className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1"
              onClick={() => { setSelectedCategory(cat); setLevel("subcategories"); setCurrentPage(1) }}
            >
              <CardContent className="p-6 text-center">
                <Package className="h-8 w-8 mx-auto text-primary" />
                <h3 className="mt-3 font-semibold text-sm">{cat}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {CATEGORIES[cat]?.subcategories.length || 0} subcategories
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Subcategory Grid */}
      {level === "subcategories" && selectedCategory && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => { setLevel("categories"); setSelectedCategory("") }}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES[selectedCategory]?.subcategories.map((sub) => (
              <Card
                key={sub}
                className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1"
                onClick={() => { setSelectedSubcategory(sub); setLevel("products"); setCurrentPage(1) }}
              >
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-sm">{sub}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Product Grid */}
      {level === "products" && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => { setLevel("subcategories"); setSelectedSubcategory("") }}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} placeholder="Search products..." className="pl-9" />
          </div>
          {paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedProducts.map((product) => (
                  <Card key={product.id} className="group hover:shadow-md transition-all">
                    <CardContent className="p-0">
                      <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-t-xl flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                      <div className="p-4">
                        <Badge variant="secondary" className="text-xs mb-2">{product.category}</Badge>
                        <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{product.model_number}</p>
                        <p className="text-xs text-muted-foreground">{product.seller_name}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-bold text-primary">{formatCurrency(product.price_per_meter)}/m</span>
                          <Button size="sm" variant="outline">
                            <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Add
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
            <EmptyState icon={Package} title="No products found" description="Try adjusting your search criteria." />
          )}
        </div>
      )}
    </div>
  )
}
