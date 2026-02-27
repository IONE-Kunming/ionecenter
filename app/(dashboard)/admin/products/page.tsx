import { getAllProducts } from "@/lib/actions/admin"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { AdminProductsList } from "./admin-products-list"

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const [products, siteCategories] = await Promise.all([
    getAllProducts(),
    getSiteCategories(),
  ])
  const categoryData = buildCategoryData(siteCategories)
  return <AdminProductsList products={products} initialSearch={search || ""} categoryData={categoryData} />
}
