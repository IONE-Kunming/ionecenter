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
      items: JSON.parse(JSON.stringify(items)),
    })

  if (error) return { error: error.message }
  return { success: true }
}
