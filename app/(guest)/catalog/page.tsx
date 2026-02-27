import { getProducts } from "@/lib/actions/products"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { CatalogGrid } from "@/components/catalog/catalog-grid"

export default async function GuestCatalogPage() {
  const [products, siteCategories] = await Promise.all([
    getProducts(),
    getSiteCategories(),
  ])
  const categoryData = buildCategoryData(siteCategories)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Product Catalog</h1>
        <p className="mt-2 text-muted-foreground">
          Browse our selection of construction materials. Sign up to purchase.
        </p>
      </div>
      <CatalogGrid products={products} basePath="/guest/product" showSignupCta categoryData={categoryData} />
    </div>
  )
}
