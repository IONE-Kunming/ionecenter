"use client"

import { useTranslations } from "next-intl"
import { BulkEditTable, type BulkEditProduct, type ImportRow } from "@/components/bulk-edit/bulk-edit-table"
import { updateProduct, deleteProduct, bulkImportProducts } from "@/lib/actions/products"
import type { CategoryData } from "@/lib/categories"

export function SellerBulkEditList({ initialProducts, categoryData }: { initialProducts: BulkEditProduct[]; categoryData: CategoryData }) {
  const t = useTranslations("bulkEdit")
  const handleSave = async (products: BulkEditProduct[]) => {
    for (const product of products) {
      const result = await updateProduct(product.id, {
        name: product.name,
        model_number: product.model_number,
        main_category: product.main_category,
        category: product.category,
        price_usd: product.price_usd,
        price_cny: product.price_cny ?? null,
        price_per_meter: product.price_usd,
        stock: product.stock,
      })
      if (result?.error) return { error: result.error }
    }
    return { success: true }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteProduct(id)
    return result ?? { success: true }
  }

  const handleImport = async (rows: ImportRow[]) => {
    const result = await bulkImportProducts(rows)
    return result
  }

  return (
    <BulkEditTable
      initialProducts={initialProducts}
      onSave={handleSave}
      onDelete={handleDelete}
      onImport={handleImport}
      title={t("bulkEditTitle")}
      subtitle={t("bulkEditSubtitle")}
      categoryData={categoryData}
    />
  )
}
