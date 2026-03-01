import { getCart } from "@/lib/actions/cart"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CheckoutClient from "./checkout-client"

export default async function CheckoutPage() {
  const cart = await getCart()
  if (!cart || cart.items.length === 0) redirect("/buyer/cart")

  const supabase = await createClient()
  const productIds = cart.items.map((item) => item.product_id)
  const { data: products } = await supabase
    .from("products")
    .select("id, name, model_number, price_per_meter, price_usd")
    .in("id", productIds)

  const enrichedItems = cart.items.map((item) => {
    const product = products?.find((p) => p.id === item.product_id)
    return { ...item, name: product?.name ?? "Unknown", model_number: product?.model_number ?? "" }
  })

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return <CheckoutClient cartItems={cart.items} subtotal={subtotal} enrichedItems={enrichedItems} />
}
