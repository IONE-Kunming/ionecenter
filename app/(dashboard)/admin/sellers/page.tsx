import { getSellersWithDetails } from "@/lib/actions/admin"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { AdminSellersList } from "./admin-sellers-list"

export default async function AdminSellersPage() {
  const [sellers, siteCategories] = await Promise.all([
    getSellersWithDetails(),
    getSiteCategories(),
  ])
  const categoryData = buildCategoryData(siteCategories)
  return <AdminSellersList sellers={sellers} categoryData={categoryData} />
}
