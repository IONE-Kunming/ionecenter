import { getProducts } from "@/lib/actions/products"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { getProductsAllImages } from "@/lib/actions/product-images"
import { GuestCatalogBrowser } from "@/components/catalog/guest-catalog-browser"

export default async function GuestCategoriesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams
  const [products, siteCategories] = await Promise.all([
    getProducts(),
    getSiteCategories(),
  ])
  const categoryData = buildCategoryData(siteCategories)

  const allImages = await getProductsAllImages(products.map((p) => p.id))

  const mapped = products.map((p) => ({
    id: p.id,
    name: p.name,
    model_number: p.model_number,
    main_category: p.main_category,
    category: p.category,
    price_per_meter: p.price_per_meter,
    pricing_type: p.pricing_type,
    price_cny: p.price_cny,
    stock: p.stock,
    seller_name: p.seller_name ?? "Unknown",
    image_url: p.image_url ?? null,
    images: allImages[p.id]?.length
      ? allImages[p.id]
      : p.image_url
        ? [{ id: "", product_id: p.id, image_url: p.image_url, is_primary: true, sort_order: 0, created_at: "" }]
        : [],
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <GuestCatalogBrowser products={mapped} categoryData={categoryData} initialCategory={category} />
    </div>
  )
}
