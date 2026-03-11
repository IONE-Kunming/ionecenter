"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"
import type { ProductImage } from "@/types/database"

/**
 * Batch-fetch primary images from product_images for multiple products.
 * Returns a map of productId → image_url for records where is_primary = true.
 */
export async function getProductsPrimaryImages(
  productIds: string[]
): Promise<Record<string, string>> {
  if (productIds.length === 0) return {}

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("product_images")
    .select("product_id, image_url")
    .in("product_id", productIds)
    .eq("is_primary", true)

  if (error || !data) return {}

  const map: Record<string, string> = {}
  for (const row of data) {
    map[row.product_id] = row.image_url
  }
  return map
}

/**
 * Get all images for a single product, ordered by is_primary DESC, sort_order ASC.
 */
export async function getProductImages(
  productId: string
): Promise<ProductImage[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true })

  if (error || !data) return []
  return data
}

/**
 * Batch-fetch all images for multiple products.
 * Returns a map of productId → ProductImage[].
 * Each product's images are ordered by is_primary DESC, sort_order ASC.
 */
export async function getProductsAllImages(
  productIds: string[]
): Promise<Record<string, ProductImage[]>> {
  if (productIds.length === 0) return {}

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .in("product_id", productIds)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true })

  if (error || !data) return {}

  const map: Record<string, ProductImage[]> = {}
  for (const row of data) {
    if (!map[row.product_id]) map[row.product_id] = []
    map[row.product_id].push(row)
  }
  return map
}

/**
 * Assign gallery images to a product. Inserts rows into product_images.
 * Marks one as primary. Also updates products.image_url for backward compat.
 */
export async function assignImagesToProduct(
  imageUrls: string[],
  productId: string,
  primaryUrl: string
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  if (imageUrls.length === 0) return { error: "No images provided" }

  const supabase = createAdminClient()

  // Verify product belongs to seller
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("seller_id", user.id)
    .maybeSingle()

  if (prodErr || !product) return { error: "Product not found or not owned by you" }

  // Insert product_images rows
  const rows = imageUrls.map((url, i) => ({
    product_id: productId,
    image_url: url,
    is_primary: url === primaryUrl,
    sort_order: i,
  }))

  const { error: insertErr } = await supabase.from("product_images").insert(rows)
  if (insertErr) return { error: insertErr.message }

  // Also update products.image_url for backward compatibility
  const { error: updateErr } = await supabase
    .from("products")
    .update({ image_url: primaryUrl })
    .eq("id", productId)
    .eq("seller_id", user.id)

  if (updateErr) return { error: updateErr.message }

  return { success: true }
}

/**
 * Search seller products for gallery linking. Returns products matching query by name or model_number.
 */
export async function searchSellerProductsForGallery(
  query: string
): Promise<{ id: string; name: string; model_number: string; image_url: string | null }[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return []

  const supabase = createAdminClient()

  let dbQuery = supabase
    .from("products")
    .select("id, name, model_number, image_url")
    .eq("seller_id", user.id)
    .order("name", { ascending: true })
    .limit(50)

  if (query && query.trim()) {
    const escaped = query.replace(/[%_\\]/g, (ch) => `\\${ch}`)
    dbQuery = dbQuery.or(
      `name.ilike.%${escaped}%,model_number.ilike.%${escaped}%`
    )
  }

  const { data, error } = await dbQuery
  if (error || !data) return []
  return data
}

/**
 * Auto-match a folder name to a product by name or model_number.
 * Returns the matched product or null.
 */
export async function autoMatchFolderToProduct(
  folderName: string
): Promise<{ id: string; name: string; model_number: string } | null> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return null

  if (!folderName.trim()) return null

  const supabase = createAdminClient()
  const escaped = folderName.trim().replace(/[%_\\]/g, (ch) => `\\${ch}`)

  // Try exact case-insensitive match on name first
  const { data: nameMatch } = await supabase
    .from("products")
    .select("id, name, model_number")
    .eq("seller_id", user.id)
    .ilike("name", escaped)
    .limit(1)

  if (nameMatch && nameMatch.length > 0) return nameMatch[0]

  // Try exact case-insensitive match on model_number
  const { data: modelMatch } = await supabase
    .from("products")
    .select("id, name, model_number")
    .eq("seller_id", user.id)
    .ilike("model_number", escaped)
    .limit(1)

  if (modelMatch && modelMatch.length > 0) return modelMatch[0]

  return null
}
