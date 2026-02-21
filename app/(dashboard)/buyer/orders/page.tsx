import { getBuyerOrders } from "@/lib/actions/orders"
import { BuyerOrdersList } from "./orders-list"

export default async function BuyerOrdersPage() {
  const orders = await getBuyerOrders()

  const mapped = orders.map((o) => ({
    id: o.id,
    status: o.status,
    payment_status: o.payment_status,
    total: o.total,
    deposit_amount: o.deposit_amount,
    created_at: o.created_at,
    seller_name: o.seller?.display_name ?? o.seller?.company ?? "Unknown",
  }))

  return <BuyerOrdersList orders={mapped} />
}
