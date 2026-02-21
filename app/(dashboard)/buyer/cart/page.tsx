import { getCart } from "@/lib/actions/cart"
import { createClient } from "@/lib/supabase/server"
import CartClient from "./cart-client"

export default async function CartPage() {
  const cart = await getCart()
  if (!cart || cart.items.length === 0) {
    return <CartClient items={[]} />
  }

  const supabase = await createClient()
  const productIds = cart.items.map((item) => item.product_id)
  const { data: products } = await supabase
    .from("products")
    .select("id, name, model_number, price_per_meter, stock, image_url")
    .in("id", productIds)

  const enrichedItems = cart.items.map((item) => {
    const product = products?.find((p) => p.id === item.product_id)
    return {
      id: item.product_id,
      name: product?.name ?? "Unknown Product",
      model_number: product?.model_number ?? "",
      price: item.price,
      quantity: item.quantity,
      stock: product?.stock ?? 0,
      image_url: product?.image_url ?? null,
    }
  })

  return <CartClient items={enrichedItems} />
}
