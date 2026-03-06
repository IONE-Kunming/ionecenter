import { getCart } from "@/lib/actions/cart"
import { createAdminClient } from "@/lib/supabase/admin"
import CartClient from "./cart-client"

export default async function CartPage() {
  const cart = await getCart()
  if (!cart || cart.items.length === 0) {
    return <CartClient items={[]} sellerMap={{}} />
  }

  const supabase = createAdminClient()
  const productIds = cart.items.map((item) => item.product_id)
  const { data: products } = await supabase
    .from("products")
    .select("id, name, model_number, price_per_meter, price_usd, stock, image_url, seller_id, pricing_type")
    .in("id", productIds)

  // Fetch seller names
  const sellerIds = [...new Set(products?.map((p) => p.seller_id) ?? [])]
  const { data: sellers } = await supabase
    .from("users")
    .select("id, display_name, company")
    .in("id", sellerIds)

  const sellerMap: Record<string, { name: string; company: string | null }> = {}
  sellers?.forEach((s) => {
    sellerMap[s.id] = { name: s.display_name, company: s.company }
  })

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
      seller_id: product?.seller_id ?? "",
      pricing_type: product?.pricing_type ?? "standard",
      length: item.length ?? null,
      width: item.width ?? null,
      total_meters: item.total_meters ?? null,
    }
  })

  return <CartClient items={enrichedItems} sellerMap={sellerMap} />
}
