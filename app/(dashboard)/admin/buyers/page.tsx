import { getAllBuyers } from "@/lib/actions/admin"
import { AdminBuyersList } from "./admin-buyers-list"

export default async function AdminBuyersPage() {
  const buyers = await getAllBuyers()

  const mapped = buyers.map((u) => ({
    id: u.id,
    display_name: u.display_name,
    email: u.email,
    role: u.role,
    company: u.company,
    user_code: u.user_code,
    created_at: u.created_at,
  }))

  return <AdminBuyersList users={mapped} />
}
