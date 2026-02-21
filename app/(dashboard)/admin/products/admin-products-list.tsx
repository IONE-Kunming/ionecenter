"use client"

import { useState } from "react"
import { Package, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import { MAIN_CATEGORIES } from "@/types/categories"
import type { Product } from "@/types/database"

export function AdminProductsList({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.model_number.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || p.main_category === categoryFilter
    return matchSearch && matchCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="pl-9" />
        </div>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} options={MAIN_CATEGORIES.map((c) => ({ value: c, label: c }))} placeholder="All Categories" className="w-full sm:w-56" />
      </div>

      {filtered.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.model_number}</TableCell>
                  <TableCell><Badge variant="secondary">{product.category}</Badge></TableCell>
                  <TableCell>{product.seller_name ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(product.price_per_meter)}/m</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "success" : "destructive"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState icon={Package} title="No products found" />
      )}
    </div>
  )
}
