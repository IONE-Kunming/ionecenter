import { getSellerOrders } from "@/lib/actions/orders"
import { SellerOrdersList } from "./orders-list"

export default async function SellerOrdersPage() {
  const orders = await getSellerOrders()

  const mapped = orders.map((o) => ({
    id: o.id,
    buyer_name: o.buyer?.display_name ?? "Unknown",
    buyer_company: o.buyer?.company ?? "",
    status: o.status,
    payment_status: o.payment_status,
    total: o.total,
    created_at: o.created_at,
  }))

  return <SellerOrdersList orders={mapped} />
}
