import { getProducts } from "@/lib/actions/products"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/category-data"
import { BuyerCatalogBrowser } from "./catalog-browser"

export default async function BuyerCatalogPage() {
  const [products, allCategories] = await Promise.all([getProducts(), getSiteCategories()])
  const categoryData = buildCategoryData(allCategories)

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

  return <BuyerCatalogBrowser products={mapped} categoryData={categoryData} />
}
