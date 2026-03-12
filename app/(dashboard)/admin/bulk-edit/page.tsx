import { getAllProducts, getAllSellers } from "@/lib/actions/admin"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { AdminBulkEditList } from "./admin-bulk-edit-list"

export default async function AdminBulkEditPage() {
  const [products, sellers, siteCategories] = await Promise.all([
    getAllProducts(),
    getAllSellers(),
    getSiteCategories(),
  ])
  const categoryData = buildCategoryData(siteCategories)

  const mapped = products.map((p) => ({
    id: p.id,
    name: p.name,
    model_number: p.model_number,
    main_category: p.main_category,
    category: p.category,
    price_usd: p.price_usd ?? p.price_per_meter,
    price_cny: p.price_cny ?? undefined,
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

  return <AdminBulkEditList initialProducts={mapped} sellers={sellerList} categoryData={categoryData} />
}
