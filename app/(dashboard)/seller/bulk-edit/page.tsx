import { getSellerProducts } from "@/lib/actions/products"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { SellerBulkEditList } from "./seller-bulk-edit-list"

export default async function SellerBulkEditPage() {
  const [products, siteCategories] = await Promise.all([
    getSellerProducts(),
    getSiteCategories(),
  ])
  const categoryData = buildCategoryData(siteCategories)

  const mapped = products.map((p) => ({
    id: p.id,
    name: p.name,
    model_number: p.model_number,
    price_usd: p.price_usd ?? p.price_per_meter,
    price_cny: p.price_cny ?? 0,
    stock: p.stock,
    is_active: p.is_active ?? true,
    image_url: p.image_url ?? null,
  }))

  return <SellerBulkEditList initialProducts={mapped} categoryData={categoryData} />
}
