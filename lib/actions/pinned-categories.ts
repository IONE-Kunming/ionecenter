"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"

export interface PinnedCategory {
  id: string
  seller_id: string
  category_name: string
  sort_order: number
  created_at: string
}

/** Fetch pinned categories for the current seller */
export async function getPinnedCategories(): Promise<PinnedCategory[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("seller_pinned_categories")
    .select("*")
    .eq("seller_id", user.id)
    .order("sort_order", { ascending: true })

  return (data ?? []) as PinnedCategory[]
}

/** Save the full list of pinned category names (replaces existing) */
export async function savePinnedCategories(categoryNames: string[]) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const supabase = createAdminClient()

  // Delete existing pinned categories for this seller
  const { error: deleteError } = await supabase
    .from("seller_pinned_categories")
    .delete()
    .eq("seller_id", user.id)

  if (deleteError) return { error: deleteError.message }

  if (categoryNames.length === 0) return { success: true }

  // Insert new pinned categories with sort order
  const rows = categoryNames.map((name, i) => ({
    seller_id: user.id,
    category_name: name,
    sort_order: i,
  }))

  const { error } = await supabase.from("seller_pinned_categories").insert(rows)
  if (error) return { error: error.message }
  return { success: true }
}
