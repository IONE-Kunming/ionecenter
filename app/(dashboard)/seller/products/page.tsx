import { getSellerProducts } from "@/lib/actions/products"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { SellerProductsList } from "./products-list"

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const [products, siteCategories] = await Promise.all([
    getSellerProducts(),
    getSiteCategories(),
  ])
  const categoryData = buildCategoryData(siteCategories)
  return <SellerProductsList initialProducts={products} initialSearch={search || ""} categoryData={categoryData} />
}
