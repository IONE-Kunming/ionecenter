"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { BulkEditTable, type BulkEditProduct, type ImportRow } from "@/components/bulk-edit/bulk-edit-table"
import { adminBulkUpdateProducts, adminDeleteProduct, adminBulkImportProducts } from "@/lib/actions/admin"
import { Select } from "@/components/ui/select"
import type { CategoryData } from "@/lib/categories"
import { useExchangeRate, usdToCny } from "@/lib/use-exchange-rate"

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
  const t = useTranslations("bulkEdit")
  const [selectedSellerId, setSelectedSellerId] = useState("")
  const { rate: exchangeRate } = useExchangeRate()

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
        main_category: p.main_category,
        category: p.category,
        price_per_meter: p.price_usd,
        price_usd: p.price_usd,
        price_cny: p.price_cny ?? usdToCny(p.price_usd, exchangeRate),
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
        <label className="text-sm font-medium whitespace-nowrap">{t("filterBySeller")}</label>
        <Select
          value={selectedSellerId}
          onChange={(e) => setSelectedSellerId(e.target.value)}
          options={sellerOptions}
          placeholder={t("allSellers")}
          className="w-full max-w-sm"
        />
      </div>

      <BulkEditTable
        key={selectedSellerId}
        initialProducts={filteredProducts}
        onSave={handleSave}
        onDelete={handleDelete}
        onImport={handleImport}
        title={t("adminBulkEditTitle")}
        subtitle={selectedSellerId
          ? `${t("managingProductsFor")} ${sellers.find((s) => s.id === selectedSellerId)?.display_name ?? t("selectedSeller")}`
          : t("adminBulkEditSubtitle")
        }
        categoryData={categoryData}
      />
    </div>
  )
}
