"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"

export interface PinnedSubcategory {
  id: string
  seller_id: string
  subcategory_id: string
  category_name: string
  parent_category_name: string
  created_at: string
}

/** Fetch pinned subcategories for the current seller, joining site_categories for the name */
export async function getPinnedSubcategories(): Promise<PinnedSubcategory[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return []

  const supabase = createAdminClient()

  const { data: pinned } = await supabase
    .from("seller_pinned_subcategories")
    .select("id, seller_id, subcategory_id, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: true })

  if (!pinned || pinned.length === 0) return []

  // Join with site_categories to get subcategory names and parent names
  const categoryIds = pinned.map((p: { subcategory_id: string }) => p.subcategory_id)
  const { data: categories } = await supabase
    .from("site_categories")
    .select("id, name, parent_id")
    .in("id", categoryIds)

  // Get parent category names
  const parentIds = (categories ?? [])
    .map((c: { parent_id: string | null }) => c.parent_id)
    .filter(Boolean) as string[]

  const { data: parents } = parentIds.length > 0
    ? await supabase.from("site_categories").select("id, name").in("id", parentIds)
    : { data: [] }

  const parentMap = new Map(
    (parents ?? []).map((c: { id: string; name: string }) => [c.id, c.name])
  )
  const categoryMap = new Map<string, { name: string; parent_name: string }>(
    (categories ?? []).map((c: { id: string; name: string; parent_id: string | null }) => [
      c.id,
      { name: c.name, parent_name: c.parent_id ? parentMap.get(c.parent_id) ?? "" : "" },
    ])
  )

  return pinned.map((row: { id: string; seller_id: string; subcategory_id: string; created_at: string }) => ({
    id: row.id,
    seller_id: row.seller_id,
    subcategory_id: row.subcategory_id,
    category_name: categoryMap.get(row.subcategory_id)?.name ?? "",
    parent_category_name: categoryMap.get(row.subcategory_id)?.parent_name ?? "",
    created_at: row.created_at,
  }))
}

/** Save the full list of pinned subcategory names (replaces existing) */
export async function savePinnedSubcategories(subcategoryNames: string[]) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const supabase = createAdminClient()

  // Delete existing pinned subcategories for this seller
  const { error: deleteError } = await supabase
    .from("seller_pinned_subcategories")
    .delete()
    .eq("seller_id", user.id)

  if (deleteError) return { error: deleteError.message }

  if (subcategoryNames.length === 0) return { success: true }

  // Look up category IDs from site_categories by name (subcategories have parent_id)
  const { data: categories } = await supabase
    .from("site_categories")
    .select("id, name")
    .in("name", subcategoryNames)
    .not("parent_id", "is", null)

  const nameToId = new Map<string, string>(
    (categories ?? []).map((c: { id: string; name: string }) => [c.name, c.id])
  )

  // Insert new pinned subcategories using subcategory_id
  const rows: { seller_id: string; subcategory_id: string }[] = []
  for (const name of subcategoryNames) {
    const categoryId = nameToId.get(name)
    if (categoryId) rows.push({ seller_id: user.id, subcategory_id: categoryId })
  }

  if (rows.length === 0) return { error: "No valid subcategories found" }

  const { error } = await supabase.from("seller_pinned_subcategories").insert(rows)
  if (error) return { error: error.message }
  return { success: true }
}
