import { getSellerProducts, getSellerCustomCategories } from "@/lib/actions/products"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { SellerBulkEditList } from "./seller-bulk-edit-list"

export default async function SellerBulkEditPage() {
  const [products, siteCategories, savedCustomCategories] = await Promise.all([
    getSellerProducts(),
    getSiteCategories(),
    getSellerCustomCategories(),
  ])
  const categoryData = buildCategoryData(siteCategories)

  const mapped = products.map((p) => ({
    id: p.id,
    name: p.name,
    model_number: p.model_number,
    main_category: p.main_category,
    category: p.category,
    custom_category: p.custom_category ?? "",
    price_usd: p.price_usd ?? p.price_per_meter,
    price_cny: p.price_cny ?? undefined,
    stock: p.stock,
    is_active: p.is_active ?? true,
    image_url: p.image_url ?? null,
  }))

  return <SellerBulkEditList initialProducts={mapped} categoryData={categoryData} savedCustomCategories={savedCustomCategories} />
}
