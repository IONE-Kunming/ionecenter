"use server"

import { revalidatePath } from "next/cache"
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
 * products.image_url. If primaryUrl is null, all images are inserted as
 * non-primary so the existing primary image (if any) is preserved.
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

  // Check if the product already has a primary image
  const { data: existingPrimary } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .eq("is_primary", true)
    .limit(1)

  const hasPrimary = existingPrimary && existingPrimary.length > 0

  // Determine the effective primary URL:
  //   - If seller explicitly chose one → use it
  //   - Else if product has no primary → auto-set first image as primary
  const effectivePrimary = primaryUrl ?? (!hasPrimary ? imageUrls[0] : null)

  if (effectivePrimary) {
    // Unset any existing primary
    await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", productId)
      .eq("is_primary", true)
  }

  // Get max sort_order to avoid conflicts with existing images
  const { data: maxSort } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)

  const nextSort = (maxSort?.[0]?.sort_order ?? -1) + 1

  // Insert product_images rows
  const rows = imageUrls.map((url, i) => ({
    product_id: productId,
    image_url: url,
    is_primary: effectivePrimary ? url === effectivePrimary : false,
    sort_order: nextSort + i,
  }))

  const { data: inserted, error: insertErr } = await supabase
    .from("product_images")
    .insert(rows)
    .select("id")
  if (insertErr) return { error: insertErr.message }
  if (!inserted || inserted.length === 0) return { error: "Failed to save images" }

  // Verify the insert succeeded by querying product_images
  const { data: saved, error: verifyErr } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .in("image_url", imageUrls)

  if (verifyErr || !saved || saved.length === 0) {
    return { error: "Failed to verify saved product images" }
  }

  // Update products.image_url when a primary was set (explicit or auto)
  if (effectivePrimary) {
    const { error: updateErr } = await supabase
      .from("products")
      .update({ image_url: effectivePrimary })
      .eq("id", productId)
      .eq("seller_id", user.id)

    if (updateErr) return { error: updateErr.message }
  }

  revalidatePath("/seller/products")
  revalidatePath("/seller/gallery/product-images")

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

/** Strip leading zeros from a digit string, keeping at least one digit. */
function stripLeadingZeros(digits: string): string {
  return digits.replace(/^0+/, "") || "0"
}

/**
 * Auto-match a folder/file name to products by name, model_number, or
 * by extracting numeric sequences and matching against product model_numbers.
 *
 * Matching strategy:
 *  1. Exact name match (case-insensitive)
 *  2. Exact model_number match (case-insensitive)
 *  3. Extract individual numeric sequences from the filename, then for each
 *     (longest first): search model_numbers that contain the number (with
 *     leading zeros stripped, then with original zeros).
 *  4. Reverse match: extract the last numeric sequence from each product
 *     model_number and check if it matches any filename numeric sequence.
 *
 * Returns an array of matching products (empty = no match).
 */
export async function autoMatchFolderToProduct(
  folderName: string
): Promise<{ id: string; name: string; model_number: string }[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return []

  const trimmed = folderName.trim()
  if (!trimmed) return []

  const supabase = createAdminClient()
  const escaped = trimmed.replace(/[%_\\]/g, (ch) => `\\${ch}`)

  // 1. Try exact case-insensitive match on name first
  const { data: nameMatch } = await supabase
    .from("products")
    .select("id, name, model_number")
    .eq("seller_id", user.id)
    .ilike("name", escaped)
    .limit(1)

  if (nameMatch && nameMatch.length > 0) return nameMatch

  // 2. Try exact case-insensitive match on model_number
  const { data: modelMatch } = await supabase
    .from("products")
    .select("id, name, model_number")
    .eq("seller_id", user.id)
    .ilike("model_number", escaped)
    .limit(1)

  if (modelMatch && modelMatch.length > 0) return modelMatch

  // 3. Extract individual numeric sequences from the filename.
  //    Strip file extension first (e.g. "01104.jpg" → "01104").
  const baseName = trimmed.replace(/\.[^.]+$/, "")
  const numericSequences = baseName.match(/\d+/g) || []

  if (numericSequences.length > 0) {
    const maxResults = 20

    // Sort by length descending to prefer longer (more specific) matches
    const sortedSequences = [...numericSequences].sort(
      (a, b) => b.length - a.length
    )

    for (const seq of sortedSequences) {
      const stripped = stripLeadingZeros(seq)
      const escapedStripped = stripped.replace(/[%_\\]/g, (ch) => `\\${ch}`)

      // Search products whose model_number contains the number (leading zeros removed)
      const { data: containsMatch } = await supabase
        .from("products")
        .select("id, name, model_number")
        .eq("seller_id", user.id)
        .ilike("model_number", `%${escapedStripped}%`)
        .limit(maxResults)

      if (containsMatch && containsMatch.length > 0) return containsMatch

      // Also try with original digits (leading zeros intact) if different
      if (seq !== stripped) {
        const escapedOrig = seq.replace(/[%_\\]/g, (ch) => `\\${ch}`)
        const { data: origMatch } = await supabase
          .from("products")
          .select("id, name, model_number")
          .eq("seller_id", user.id)
          .ilike("model_number", `%${escapedOrig}%`)
          .limit(maxResults)

        if (origMatch && origMatch.length > 0) return origMatch
      }
    }

    // 4. Reverse match: extract the last numeric sequence from each product
    //    model_number and check if it matches any of the filename's numeric
    //    sequences (with leading zeros stripped).
    const fileDigitsSet = new Set(
      sortedSequences.map((s) => stripLeadingZeros(s))
    )

    const { data: allProducts } = await supabase
      .from("products")
      .select("id, name, model_number")
      .eq("seller_id", user.id)
      .limit(500)

    if (allProducts && allProducts.length > 0) {
      const matched = allProducts.filter((p) => {
        if (!p.model_number) return false
        const modelNums = p.model_number.match(/\d+/g)
        if (!modelNums || modelNums.length === 0) return false
        const lastModelDigits = stripLeadingZeros(
          modelNums[modelNums.length - 1]
        )
        return fileDigitsSet.has(lastModelDigits)
      })

      if (matched.length > 0)
        return matched.slice(0, maxResults).map((p) => ({
          id: p.id,
          name: p.name,
          model_number: p.model_number,
        }))
    }
  }

  return []
}
