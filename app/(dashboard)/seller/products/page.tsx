"use client"

import { useState } from "react"
import { Package, Plus, Search, Upload, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, getStockStatus } from "@/lib/utils"
import { MAIN_CATEGORIES, getSubcategories } from "@/types/categories"

const initialProducts = [
  { id: "1", name: "Premium Window Profile", model_number: "WP-6063-T5", main_category: "Aluminum Profiles", category: "Window & Door Profiles", price_per_meter: 12.50, stock: 500, is_active: true },
  { id: "2", name: "Curtain Wall Section", model_number: "CW-100-A", main_category: "Aluminum Profiles", category: "Curtain Wall Profiles", price_per_meter: 28.00, stock: 350, is_active: true },
  { id: "3", name: "Industrial T-Slot Profile", model_number: "TS-4040-V2", main_category: "Aluminum Profiles", category: "Industrial Profiles", price_per_meter: 8.75, stock: 1200, is_active: true },
  { id: "4", name: "Door Handle Set Chrome", model_number: "DH-CHR-01", main_category: "Hardware & Accessories", category: "Handles & Locks", price_per_meter: 35.00, stock: 450, is_active: true },
]

export default function SellerProductsPage() {
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")

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
        <Button onClick={() => setShowAddModal(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
        <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" /> Import CSV</Button>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const stockInfo = getStockStatus(product.stock)
            return (
              <Card key={product.id} className="group">
                <CardContent className="p-0">
                  <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-t-xl flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                  <div className="p-4">
                    <Badge variant="secondary" className="text-xs mb-2">{product.category}</Badge>
                    <h3 className="font-semibold text-sm">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.model_number}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-primary text-sm">{formatCurrency(product.price_per_meter)}/m</span>
                      <Badge variant={stockInfo.color === "green" ? "success" : stockInfo.color === "yellow" ? "warning" : "destructive"} className="text-xs">
                        {stockInfo.label} ({product.stock})
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1 gap-1"><Pencil className="h-3 w-3" /> Edit</Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={Package} title="No products found" action={{ label: "Add Product", onClick: () => setShowAddModal(true) }} />
      )}

      {/* Add Product Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Product Name</Label><Input placeholder="e.g., Window Profile" /></div>
              <div className="space-y-2"><Label>Model Number</Label><Input placeholder="e.g., WP-001" /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Main Category</Label>
                <Select options={MAIN_CATEGORIES.map((c) => ({ value: c, label: c }))} placeholder="Select category" onChange={(e) => setSelectedCategory(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select options={getSubcategories(selectedCategory).map((c) => ({ value: c, label: c }))} placeholder="Select subcategory" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Price per Meter ($)</Label><Input type="number" step="0.01" placeholder="0.00" /></div>
              <div className="space-y-2"><Label>Stock</Label><Input type="number" placeholder="0" /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Product description..." rows={3} /></div>
            <div className="space-y-2"><Label>Product Image</Label><Input type="file" accept="image/*" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={() => setShowAddModal(false)}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
