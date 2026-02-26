import { getProducts } from "@/lib/actions/products"
import { BuyerCatalogBrowser } from "@/app/(dashboard)/buyer/catalog/catalog-browser"

export default async function SellerPreviewPage() {
  const rawProducts = await getProducts()
  const products = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    model_number: p.model_number,
    main_category: p.main_category,
    category: p.category,
    price_per_meter: p.price_per_meter,
    stock: p.stock,
    seller_name: p.seller_name ?? "",
    image_url: p.image_url ?? null,
  }))

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
        You are viewing the store as a buyer would see it. This is a read-only preview.
      </div>
      <BuyerCatalogBrowser products={products} />
    </div>
  )
}
