import { getSellerProducts } from "@/lib/actions/products"
import { SellerBulkEditList } from "./seller-bulk-edit-list"

export default async function SellerBulkEditPage() {
  const products = await getSellerProducts()

  const mapped = products.map((p) => ({
    id: p.id,
    name: p.name,
    model_number: p.model_number,
    price_per_meter: p.price_per_meter,
    stock: p.stock,
    is_active: p.is_active ?? true,
    image_url: p.image_url ?? null,
  }))

  return <SellerBulkEditList initialProducts={mapped} />
}
