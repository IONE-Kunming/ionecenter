"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"
import type { Cart, CartItem } from "@/types/database"

export async function getCart(): Promise<Cart | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createAdminClient()
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

  const supabase = createAdminClient()
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

  const supabase = createAdminClient()

  // Get product price and stock
  const { data: product } = await supabase
    .from("products")
    .select("price_per_meter, stock")
    .eq("id", productId)
    .single()

  if (!product) return { error: "Product not found" }

  // Validate quantity
  if (quantity < 1) return { error: "Quantity must be at least 1" }

  // Get existing cart
  const { data: cart } = await supabase
    .from("carts")
    .select("*")
    .eq("user_id", user.id)
    .single()

  const items: CartItem[] = Array.isArray(cart?.items) ? (cart.items as CartItem[]) : []
  const existing = items.find((i) => i.product_id === productId)
  const currentQty = existing ? existing.quantity : 0

  if (currentQty + quantity > product.stock) {
    return { error: `Cannot exceed available stock (${product.stock} units available, ${currentQty} already in cart)` }
  }

  if (existing) {
    existing.quantity += quantity
  } else {
    items.push({ product_id: productId, quantity, price: product.price_per_meter })
  }

  const { error } = await supabase
    .from("carts")
    .upsert({ user_id: user.id, items })

  if (error) return { error: error.message }
  revalidatePath("/buyer/cart")
  return { success: true }
}
