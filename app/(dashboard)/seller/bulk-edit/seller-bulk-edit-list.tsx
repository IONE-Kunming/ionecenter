"use client"

import { BulkEditTable, type BulkEditProduct, type ImportRow } from "@/components/bulk-edit/bulk-edit-table"
import { updateProduct, deleteProduct, bulkImportProducts } from "@/lib/actions/products"

export function SellerBulkEditList({ initialProducts }: { initialProducts: BulkEditProduct[] }) {
  const handleSave = async (products: BulkEditProduct[]) => {
    for (const product of products) {
      const result = await updateProduct(product.id, {
        name: product.name,
        model_number: product.model_number,
        price_per_meter: product.price_per_meter,
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
      title="Bulk Edit"
      subtitle="MY PRODUCTS — INLINE EDITOR"
    />
  )
}
