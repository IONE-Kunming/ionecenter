"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"

export interface PinnedCategory {
  id: string
  seller_id: string
  category_id: string
  category_name: string // derived from site_categories join
  created_at: string
}

/** Fetch pinned categories for the current seller, joining site_categories for the name */
export async function getPinnedCategories(): Promise<PinnedCategory[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return []

  const supabase = createAdminClient()

  // Fetch pinned rows
  const { data: pinned } = await supabase
    .from("seller_pinned_categories")
    .select("id, seller_id, category_id, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: true })

  if (!pinned || pinned.length === 0) return []

  // Join with site_categories to get category names
  const categoryIds = pinned.map((p: { category_id: string }) => p.category_id)
  const { data: categories } = await supabase
    .from("site_categories")
    .select("id, name")
    .in("id", categoryIds)

  const categoryMap = new Map(
    (categories ?? []).map((c: { id: string; name: string }) => [c.id, c.name])
  )

  return pinned.map((row: { id: string; seller_id: string; category_id: string; created_at: string }) => ({
    id: row.id,
    seller_id: row.seller_id,
    category_id: row.category_id,
    category_name: categoryMap.get(row.category_id) ?? "",
    created_at: row.created_at,
  }))
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

  // Look up category IDs from site_categories by name
  const { data: categories } = await supabase
    .from("site_categories")
    .select("id, name")
    .in("name", categoryNames)

  const nameToId = new Map(
    (categories ?? []).map((c: { id: string; name: string }) => [c.name, c.id])
  )

  // Insert new pinned categories using category_id
  const rows: { seller_id: string; category_id: string }[] = []
  for (const name of categoryNames) {
    const categoryId = nameToId.get(name)
    if (categoryId) rows.push({ seller_id: user.id, category_id: categoryId })
  }

  if (rows.length === 0) return { error: "No matching categories found" }

  const { error } = await supabase.from("seller_pinned_categories").insert(rows)
  if (error) return { error: error.message }
  return { success: true }
}
