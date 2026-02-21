import { getProducts } from "@/lib/actions/products"
import { BuyerCatalogBrowser } from "./catalog-browser"

export default async function BuyerCatalogPage() {
  const products = await getProducts()

  const mapped = products.map((p) => ({
    id: p.id,
    name: p.name,
    model_number: p.model_number,
    main_category: p.main_category,
    category: p.category,
    price_per_meter: p.price_per_meter,
    stock: p.stock,
    seller_name: p.seller_name ?? "Unknown",
  }))

  return <BuyerCatalogBrowser products={mapped} />
}
