import { getSellersWithDetails } from "@/lib/actions/admin"
import { AdminSellersList } from "./admin-sellers-list"

export default async function AdminSellersPage() {
  const sellers = await getSellersWithDetails()
  return <AdminSellersList sellers={sellers} />
}
