import { getAllProducts, getAllSellers } from "@/lib/actions/admin"
import { AdminBulkEditList } from "./admin-bulk-edit-list"

export default async function AdminBulkEditPage() {
  const [products, sellers] = await Promise.all([
    getAllProducts(),
    getAllSellers(),
  ])

  const mapped = products.map((p) => ({
    id: p.id,
    name: p.name,
    model_number: p.model_number,
    price_per_meter: p.price_per_meter,
    stock: p.stock,
    is_active: p.is_active ?? true,
    image_url: p.image_url ?? null,
    seller_id: p.seller_id,
  }))

  const sellerList = sellers.map((s) => ({
    id: s.id,
    display_name: s.display_name ?? s.email ?? "Unknown",
    company: s.company ?? "",
  }))

  return <AdminBulkEditList initialProducts={mapped} sellers={sellerList} />
}
