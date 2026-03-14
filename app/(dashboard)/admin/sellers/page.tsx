import { getSellersWithDetails } from "@/lib/actions/admin"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { AdminSellersList } from "./admin-sellers-list"

export default async function AdminSellersPage() {
  const [sellers, siteCategories] = await Promise.all([
    getSellersWithDetails(),
    getSiteCategories(),
  ])
  return <AdminSellersList sellers={sellers} siteCategories={siteCategories} />
}
