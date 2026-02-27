import { getProducts } from "@/lib/actions/products"
import { getWishlistProductIds } from "@/lib/actions/wishlist"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { AllProductsList } from "./all-products-list"

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const [products, siteCategories, wishlistedIds] = await Promise.all([
    getProducts(),
    getSiteCategories(),
    getWishlistProductIds(),
  ])
  const categoryData = buildCategoryData(siteCategories)
  return <AllProductsList products={products} initialSearch={search || ""} categoryData={categoryData} wishlistedIds={wishlistedIds} />
}
