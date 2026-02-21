"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "./users"
import type { Product } from "@/types/database"

export async function getProducts(filters?: {
  category?: string
  search?: string
  sellerId?: string
}): Promise<Product[]> {
  const supabase = await createClient()
  let query = supabase
    .from("products")
    .select("*, seller:users!seller_id(display_name)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (filters?.category) {
    query = query.eq("main_category", filters.category)
  }
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,model_number.ilike.%${filters.search}%`
    )
  }
  if (filters?.sellerId) {
    query = query.eq("seller_id", filters.sellerId)
  }

  const { data } = await query
  return (data ?? []).map((p) => ({
    ...p,
    seller_name: (p.seller as unknown as { display_name: string })?.display_name,
  }))
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("products")
    .select("*, seller:users!seller_id(display_name, company, city, country)")
    .eq("id", id)
    .single()

  if (!data) return null
  return {
    ...data,
    seller_name: (data.seller as unknown as { display_name: string })?.display_name,
  }
}

export async function getSellerProducts(): Promise<Product[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  return data ?? []
}

export async function createProduct(
  product: Omit<Product, "id" | "seller_id" | "created_at" | "updated_at" | "stock_status" | "seller_name">
) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .insert({ ...product, seller_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>
) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .eq("seller_id", user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteProduct(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("seller_id", user.id)

  if (error) return { error: error.message }
  return { success: true }
}
