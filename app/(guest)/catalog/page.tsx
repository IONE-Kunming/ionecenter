import { getProducts } from "@/lib/actions/products"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { CatalogGrid } from "@/components/catalog/catalog-grid"

export default async function GuestCatalogPage() {
  const products = await getProducts()

  let categoryNames: string[] = []
  try {
    const allCategories = await getSiteCategories()
    categoryNames = allCategories
      .filter((c) => !c.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => c.name)
  } catch {
    // Fall back to empty — CatalogGrid will use hardcoded MAIN_CATEGORIES
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Product Catalog</h1>
        <p className="mt-2 text-muted-foreground">
          Browse our selection of construction materials. Sign up to purchase.
        </p>
      </div>
      <CatalogGrid
        products={products}
        basePath="/guest/product"
        showSignupCta
        categoryNames={categoryNames.length > 0 ? categoryNames : undefined}
      />
    </div>
  )
}
