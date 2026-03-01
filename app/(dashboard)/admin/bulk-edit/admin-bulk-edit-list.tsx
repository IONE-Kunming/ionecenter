"use client"

import { useState, useMemo } from "react"
import { BulkEditTable, type BulkEditProduct, type ImportRow } from "@/components/bulk-edit/bulk-edit-table"
import { adminBulkUpdateProducts, adminDeleteProduct, adminBulkImportProducts } from "@/lib/actions/admin"
import { Select } from "@/components/ui/select"
import type { CategoryData } from "@/lib/categories"

interface AdminProduct extends BulkEditProduct {
  seller_id: string
}

interface Seller {
  id: string
  display_name: string
  company: string
}

export function AdminBulkEditList({
  initialProducts,
  sellers,
  categoryData,
}: {
  initialProducts: AdminProduct[]
  sellers: Seller[]
  categoryData: CategoryData
}) {
  const [selectedSellerId, setSelectedSellerId] = useState("")

  const filteredProducts = useMemo(() => {
    if (!selectedSellerId) return initialProducts
    return initialProducts.filter((p) => p.seller_id === selectedSellerId)
  }, [initialProducts, selectedSellerId])

  const handleSave = async (products: BulkEditProduct[]) => {
    const result = await adminBulkUpdateProducts(
      products.map((p) => ({
        id: p.id,
        name: p.name,
        model_number: p.model_number,
        price_per_meter: p.price_usd,
        stock: p.stock,
        is_active: p.is_active,
      }))
    )
    return result
  }

  const handleDelete = async (id: string) => {
    const result = await adminDeleteProduct(id)
    return result
  }

  const handleImport = async (rows: ImportRow[]) => {
    const result = await adminBulkImportProducts(rows, selectedSellerId || undefined)
    return result
  }

  const sellerOptions = sellers.map((s) => ({
    value: s.id,
    label: s.company ? `${s.display_name} — ${s.company}` : s.display_name,
  }))

  return (
    <div className="space-y-4">
      {/* Seller selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium whitespace-nowrap">Filter by seller:</label>
        <Select
          value={selectedSellerId}
          onChange={(e) => setSelectedSellerId(e.target.value)}
          options={sellerOptions}
          placeholder="All Sellers"
          className="w-full max-w-sm"
        />
      </div>

      <BulkEditTable
        initialProducts={filteredProducts}
        onSave={handleSave}
        onDelete={handleDelete}
        onImport={handleImport}
        title="Admin Bulk Edit"
        subtitle={selectedSellerId
          ? `MANAGING PRODUCTS FOR: ${sellers.find((s) => s.id === selectedSellerId)?.display_name ?? "SELECTED SELLER"}`
          : "ALL SELLER PRODUCTS — INLINE EDITOR"
        }
        categoryData={categoryData}
      />
    </div>
  )
}
