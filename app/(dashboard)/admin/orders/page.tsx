import { getAllOrders } from "@/lib/actions/admin"
import { AdminOrdersList } from "./admin-orders-list"

export default async function AdminOrdersPage() {
  const orders = await getAllOrders()

  const mapped = orders.map((o) => ({
    id: o.id,
    status: o.status,
    payment_status: o.payment_status,
    total: o.total,
    created_at: o.created_at,
    buyer_name: o.buyer?.display_name ?? o.buyer?.company ?? "Unknown",
    seller_name: o.seller?.display_name ?? o.seller?.company ?? "Unknown",
  }))

  return <AdminOrdersList orders={mapped} />
}
