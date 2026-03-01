"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"

export interface WishlistProductItem {
  wishlist_id: string
  created_at: string
  id: string
  name: string
  model_number: string
  category: string
  price_per_meter: number
  pricing_type: string
  price_usd: number | null
  price_cny: number | null
  stock: number
  image_url: string | null
  [key: string]: unknown
}

export async function getWishlistProductIds(): Promise<string[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("user_id", user.id)

  return (data ?? []).map((row) => row.product_id)
}

export async function toggleWishlist(productId: string): Promise<{ liked: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { liked: false, error: "Not authenticated" }

  const supabase = createAdminClient()

  // Check if already in wishlist
  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .single()

  if (existing) {
    // Remove from wishlist
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", existing.id)

    if (error) return { liked: true, error: error.message }
    return { liked: false }
  } else {
    // Add to wishlist
    const { error } = await supabase
      .from("wishlists")
      .insert({ user_id: user.id, product_id: productId })

    if (error) return { liked: false, error: error.message }
    return { liked: true }
  }
}

export async function getWishlistProducts(): Promise<WishlistProductItem[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("wishlists")
    .select("id, product_id, created_at, product:products!product_id(id, name, model_number, category, price_per_meter, pricing_type, price_usd, price_cny, stock, image_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (data ?? [])
    .filter((row) => row.product !== null)
    .map((row) => {
      const product = row.product as unknown as Record<string, unknown>
      return {
        wishlist_id: row.id as string,
        created_at: row.created_at as string,
        id: product.id as string,
        name: product.name as string,
        model_number: product.model_number as string,
        category: product.category as string,
        price_per_meter: product.price_per_meter as number,
        pricing_type: (product.pricing_type as string) || "standard",
        price_usd: product.price_usd as number | null,
        price_cny: product.price_cny as number | null,
        stock: product.stock as number,
        image_url: product.image_url as string | null,
      }
    })
}
