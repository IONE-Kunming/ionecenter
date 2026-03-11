"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"
import type { ProductImage } from "@/types/database"

/**
 * Product with all its images for the Product Images management page.
 */
export interface ProductWithImages {
  id: string
  name: string
  model_number: string
  description: string | null
  image_url: string | null
  images: ProductImage[]
}

/**
 * Fetch all seller products along with all their images from product_images table.
 */
export async function getSellerProductsWithImages(): Promise<ProductWithImages[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return []

  const supabase = createAdminClient()
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, name, model_number, description, image_url")
    .eq("seller_id", user.id)
    .order("name", { ascending: true })

  if (prodErr || !products || products.length === 0) return []

  const productIds = products.map((p: { id: string }) => p.id)
  const { data: images, error: imgErr } = await supabase
    .from("product_images")
    .select("*")
    .in("product_id", productIds)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true })

  const imageMap: Record<string, ProductImage[]> = {}
  if (!imgErr && images) {
    for (const img of images) {
      if (!imageMap[img.product_id]) imageMap[img.product_id] = []
      imageMap[img.product_id].push(img)
    }
  }

  return products.map((p: { id: string; name: string; model_number: string; description: string | null; image_url: string | null }) => ({
    id: p.id,
    name: p.name,
    model_number: p.model_number,
    description: p.description,
    image_url: p.image_url,
    images: imageMap[p.id] ?? [],
  }))
}

/**
 * Set an image as primary for its product.
 * Unsets is_primary on all other images of the same product.
 * Also updates products.image_url for backward compatibility.
 */
export async function setProductImageAsPrimary(
  imageId: string
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const supabase = createAdminClient()

  // Fetch the image to find its product
  const { data: image, error: fetchErr } = await supabase
    .from("product_images")
    .select("id, product_id, image_url")
    .eq("id", imageId)
    .maybeSingle()

  if (fetchErr || !image) return { error: "Image not found" }

  // Verify product belongs to seller
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("id")
    .eq("id", image.product_id)
    .eq("seller_id", user.id)
    .maybeSingle()

  if (prodErr || !product) return { error: "Product not found or not owned by you" }

  // Unset is_primary on all images of this product
  const { error: unsetErr } = await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", image.product_id)

  if (unsetErr) return { error: unsetErr.message }

  // Set this image as primary
  const { error: setErr } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId)

  if (setErr) return { error: setErr.message }

  // Update products.image_url for backward compatibility
  await supabase
    .from("products")
    .update({ image_url: image.image_url })
    .eq("id", image.product_id)

  return { success: true }
}

/**
 * Add new images to an existing product.
 * Creates product_images rows. Does not set any as primary unless the product has no primary image.
 */
export async function addImagesToProduct(
  productId: string,
  imageUrls: string[]
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

  // Check if product already has a primary image
  const { data: existing } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .eq("is_primary", true)
    .limit(1)

  const hasPrimary = existing && existing.length > 0

  // Get max sort_order
  const { data: maxSort } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)

  const nextSort = (maxSort?.[0]?.sort_order ?? -1) + 1

  const rows = imageUrls.map((url, i) => ({
    product_id: productId,
    image_url: url,
    is_primary: !hasPrimary && i === 0,
    sort_order: nextSort + i,
  }))

  const { error: insertErr } = await supabase.from("product_images").insert(rows)
  if (insertErr) return { error: insertErr.message }

  // If no primary existed, update products.image_url for backward compat
  if (!hasPrimary) {
    await supabase
      .from("products")
      .update({ image_url: imageUrls[0] })
      .eq("id", productId)
  }

  return { success: true }
}

/**
 * Batch-fetch the display image from product_images for multiple products.
 * For each product, returns the primary image (is_primary = true).
 * If no primary image exists, returns the first image ordered by sort_order.
 * Returns a map of productId → image_url.
 */
export async function getProductsPrimaryImages(
  productIds: string[]
): Promise<Record<string, string>> {
  if (productIds.length === 0) return {}

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("product_images")
    .select("product_id, image_url, is_primary")
    .in("product_id", productIds)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true })

  if (error || !data) return {}

  const map: Record<string, string> = {}
  for (const row of data) {
    // First row per product wins (primary first, then by sort_order)
    if (!map[row.product_id]) {
      map[row.product_id] = row.image_url
    }
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
  // Ensure per-product ordering: is_primary DESC, sort_order ASC
  for (const pid of Object.keys(map)) {
    map[pid].sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
      return a.sort_order - b.sort_order
    })
  }
  return map
}

/**
 * Assign gallery images to a product. Inserts rows into product_images.
 * If primaryUrl is provided, marks that image as primary and updates
 * products.image_url. If primaryUrl is null and the product already has
 * images, all new images are inserted as non-primary so the existing
 * primary image is preserved. If the product has no images yet, the first
 * assigned image is automatically set as primary.
 */
export async function assignImagesToProduct(
  imageUrls: string[],
  productId: string,
  primaryUrl: string | null
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

  // If no primary was explicitly chosen, check whether the product already has
  // images. When the product has zero images the first assigned image should
  // automatically become the primary so it shows on the product card.
  if (!primaryUrl) {
    const { count } = await supabase
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId)

    if (count === 0) {
      primaryUrl = imageUrls[0]
    }
  }

  if (primaryUrl) {
    // Seller explicitly chose a new primary — unset any existing primary
    await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", productId)
      .eq("is_primary", true)
  }

  // Insert product_images rows
  const rows = imageUrls.map((url, i) => ({
    product_id: productId,
    image_url: url,
    is_primary: primaryUrl ? url === primaryUrl : false,
    sort_order: i,
  }))

  const { error: insertErr } = await supabase.from("product_images").insert(rows)
  if (insertErr) return { error: insertErr.message }

  // Update products.image_url when a primary image was chosen or auto-selected
  if (primaryUrl) {
    const { error: updateErr } = await supabase
      .from("products")
      .update({ image_url: primaryUrl })
      .eq("id", productId)
      .eq("seller_id", user.id)

    if (updateErr) return { error: updateErr.message }
  }

  return { success: true }
}

/**
 * Delete a single image from product_images.
 * If the deleted image was primary, promote the next available image.
 * Does NOT modify products.image_url.
 */
export async function deleteProductImage(
  imageId: string
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const supabase = createAdminClient()

  // Fetch the image to delete (join with products to verify ownership)
  const { data: image, error: fetchErr } = await supabase
    .from("product_images")
    .select("id, product_id, is_primary")
    .eq("id", imageId)
    .maybeSingle()

  if (fetchErr || !image) return { error: "Image not found" }

  // Verify product belongs to the seller
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("id")
    .eq("id", image.product_id)
    .eq("seller_id", user.id)
    .maybeSingle()

  if (prodErr || !product) return { error: "Product not found or not owned by you" }

  // Delete the image
  const { error: deleteErr } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)

  if (deleteErr) return { error: deleteErr.message }

  // If the deleted image was primary, promote the next available image
  if (image.is_primary) {
    const { data: remaining, error: remainErr } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", image.product_id)
      .order("sort_order", { ascending: true })
      .limit(1)

    if (!remainErr && remaining && remaining.length > 0) {
      await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", remaining[0].id)
    }
  }

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
