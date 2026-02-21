import { getAllProducts } from "@/lib/actions/admin"
import { AdminBulkEditList } from "./admin-bulk-edit-list"

export default async function AdminBulkEditPage() {
  const products = await getAllProducts()

  const mapped = products.map((p) => ({
    id: p.id,
    name: p.name,
    model_number: p.model_number,
    price_per_meter: p.price_per_meter,
    stock: p.stock,
  }))

  return <AdminBulkEditList initialProducts={mapped} />
}
