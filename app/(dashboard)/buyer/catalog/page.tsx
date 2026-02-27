import { getProducts } from "@/lib/actions/products"
import { getWishlistProductIds } from "@/lib/actions/wishlist"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { BuyerCatalogBrowser } from "./catalog-browser"

export default async function BuyerCatalogPage() {
  const [products, siteCategories, wishlistedIds] = await Promise.all([
    getProducts(),
    getSiteCategories(),
    getWishlistProductIds(),
  ])
  const categoryData = buildCategoryData(siteCategories)

  const mapped = products.map((p) => ({
    id: p.id,
    name: p.name,
    model_number: p.model_number,
    main_category: p.main_category,
    category: p.category,
    price_per_meter: p.price_per_meter,
    stock: p.stock,
    seller_name: p.seller_name ?? "Unknown",
    image_url: p.image_url ?? null,
  }))

  return <BuyerCatalogBrowser products={mapped} categoryData={categoryData} wishlistedIds={wishlistedIds} />
}
