import { getAllSellers } from "@/lib/actions/admin"
import { AdminSellersList } from "./admin-sellers-list"

export default async function AdminSellersPage() {
  const sellers = await getAllSellers()

  const mapped = sellers.map((s) => ({
    id: s.id,
    display_name: s.display_name,
    email: s.email,
    company: s.company,
    phone_number: s.phone_number,
    city: s.city,
    country: s.country,
    product_count: s.product_count,
    order_count: s.order_count,
    created_at: s.created_at,
  }))

  return <AdminSellersList sellers={mapped} />
}
