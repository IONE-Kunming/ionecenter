"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "./users"
import type { Cart, CartItem } from "@/types/database"

export async function getCart(): Promise<Cart | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from("carts")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return data
}

export async function updateCart(items: CartItem[]) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("carts")
    .upsert({
      user_id: user.id,
      items,
    })

  if (error) return { error: error.message }
  return { success: true }
}

export async function addToCart(productId: string, quantity: number) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Get product price
  const { data: product } = await supabase
    .from("products")
    .select("price_per_meter")
    .eq("id", productId)
    .single()

  if (!product) return { error: "Product not found" }

  // Get existing cart
  const { data: cart } = await supabase
    .from("carts")
    .select("*")
    .eq("user_id", user.id)
    .single()

  const items: CartItem[] = Array.isArray(cart?.items) ? (cart.items as CartItem[]) : []
  const existing = items.find((i) => i.product_id === productId)

  if (existing) {
    existing.quantity += quantity
  } else {
    items.push({ product_id: productId, quantity, price: product.price_per_meter })
  }

  const { error } = await supabase
    .from("carts")
    .upsert({ user_id: user.id, items })

  if (error) return { error: error.message }
  return { success: true }
}
