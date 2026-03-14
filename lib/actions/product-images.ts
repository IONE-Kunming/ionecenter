"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"
import { listGallery } from "./gallery"
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
  custom_category?: string | null
  images: ProductImage[]
}

/**
 * Fetch all seller products along with all their images from product_images table.
 * Uses a Supabase foreign-key join so images are reliably associated with each product.
 */
export async function getSellerProductsWithImages(): Promise<ProductWithImages[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("products")
    .select("id, name, model_number, description, image_url, custom_category, product_images(*)")
    .eq("seller_id", user.id)
    .order("name", { ascending: true })

  if (error || !data) return []

  type Row = {
    id: string
    name: string
    model_number: string
    description: string | null
    image_url: string | null
    custom_category?: string | null
    product_images: ProductImage[]
  }

  return (data as Row[]).map((p) => {
    const images = [...p.product_images].sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
      return a.sort_order - b.sort_order
    })
    return {
      id: p.id,
      name: p.name,
      model_number: p.model_number,
      description: p.description,
      image_url: images[0]?.image_url ?? p.image_url ?? null,
      custom_category: p.custom_category ?? null,
      images,
    }
  })
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

  revalidatePath("/seller/gallery/product-images")
  revalidatePath("/seller/products")

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

  revalidatePath("/seller/gallery/product-images")
  revalidatePath("/seller/products")

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
 * If primaryUrl is provided and present in imageUrls, marks that image as
 * primary and updates products.image_url. If primaryUrl is null (or not in
 * imageUrls) and the product has no existing primary image, the first
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

  // Check if the product already has a primary image
  const { data: existingPrimary } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .eq("is_primary", true)
    .limit(1)

  const hasPrimary = existingPrimary && existingPrimary.length > 0

  // Determine the effective primary URL:
  //   - If seller explicitly chose one that is in the list → use it
  //   - Else if product has no primary → auto-set first image as primary
  //   - Otherwise keep existing primary (effectivePrimary = null)
  const validPrimary = primaryUrl && imageUrls.includes(primaryUrl) ? primaryUrl : null
  const effectivePrimary = validPrimary ?? (!hasPrimary ? imageUrls[0] : null)

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

  // Safety: ensure the product has at least one primary image
  const { data: primaryAfter } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .eq("is_primary", true)
    .limit(1)

  if (!primaryAfter || primaryAfter.length === 0) {
    const { data: first } = await supabase
      .from("product_images")
      .select("id, image_url")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .limit(1)

    if (first && first.length > 0) {
      const { error: promoteErr } = await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", first[0].id)

      if (promoteErr) {
        console.error("[assignImagesToProduct] Failed to promote primary:", promoteErr.message)
      } else {
        await supabase
          .from("products")
          .update({ image_url: first[0].image_url })
          .eq("id", productId)
          .eq("seller_id", user.id)
      }
    }
  }

  revalidatePath("/seller/products")
  revalidatePath("/seller/gallery/product-images")

  return { success: true }
}

/**
 * Delete a single image from product_images.
 * If the deleted image was primary, promote the next available image
 * and update products.image_url for backward compatibility.
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
      .select("id, image_url")
      .eq("product_id", image.product_id)
      .order("sort_order", { ascending: true })
      .limit(1)

    if (!remainErr && remaining && remaining.length > 0) {
      await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", remaining[0].id)

      // Update products.image_url to the new primary image
      await supabase
        .from("products")
        .update({ image_url: remaining[0].image_url })
        .eq("id", image.product_id)
    } else {
      // No images left — clear products.image_url
      await supabase
        .from("products")
        .update({ image_url: null })
        .eq("id", image.product_id)
    }
  }

  revalidatePath("/seller/gallery/product-images")
  revalidatePath("/seller/products")

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
 * Auto-match a folder/file name to products by model_number.
 *
 * Matching priority:
 *  Case 1 — Exact match: filename matches the full model number exactly.
 *  Case 2 — Numbers only match: filename is purely numeric; strip leading
 *           zeros and check if a model number ends with that number.
 *  Case 3 — Partial match: filename is contained anywhere within a model number.
 *  Case 4 — Model number contained in filename: the full model number appears
 *           inside the filename.
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
  const maxResults = 20

  // Strip file extension (e.g. "01104.jpg" → "01104")
  const baseName = trimmed.replace(/\.[^.]+$/, "")
  if (!baseName) return []

  const escaped = baseName.replace(/[%_\\]/g, (ch) => `\\${ch}`)

  // Case 1 — Exact match: filename matches the full model number exactly
  const { data: exactMatch } = await supabase
    .from("products")
    .select("id, name, model_number")
    .eq("seller_id", user.id)
    .ilike("model_number", escaped)
    .limit(maxResults)

  if (exactMatch && exactMatch.length > 0) return exactMatch

  // Case 2 — Numbers only match: filename is purely numeric; strip leading
  // zeros and check if a model number ends with that number.
  if (/^\d+$/.test(baseName)) {
    const stripped = stripLeadingZeros(baseName)
    const escapedStripped = stripped.replace(/[%_\\]/g, (ch) => `\\${ch}`)

    const { data: numMatch } = await supabase
      .from("products")
      .select("id, name, model_number")
      .eq("seller_id", user.id)
      .ilike("model_number", `%${escapedStripped}`)
      .limit(maxResults)

    if (numMatch && numMatch.length > 0) return numMatch
  }

  // Case 3 — Partial match: filename is contained anywhere within the model number
  const { data: partialMatch } = await supabase
    .from("products")
    .select("id, name, model_number")
    .eq("seller_id", user.id)
    .ilike("model_number", `%${escaped}%`)
    .limit(maxResults)

  if (partialMatch && partialMatch.length > 0) return partialMatch

  // Case 4 — Model number contained in filename: the full model number
  // appears inside the image filename
  const { data: allProducts } = await supabase
    .from("products")
    .select("id, name, model_number")
    .eq("seller_id", user.id)
    .limit(500)

  if (allProducts && allProducts.length > 0) {
    const baseNameLower = baseName.toLowerCase()
    const matched = allProducts.filter((p) => {
      if (!p.model_number) return false
      return baseNameLower.includes(p.model_number.toLowerCase())
    })

    if (matched.length > 0)
      return matched.slice(0, maxResults).map((p) => ({
        id: p.id,
        name: p.name,
        model_number: p.model_number,
      }))
  }

  return []
}

/**
 * Auto-match ALL images in a gallery folder to products at once.
 *
 * For each image in the folder:
 *  - Strip the timestamp prefix to recover the original filename
 *  - Run the same 4-case matching algorithm as autoMatchFolderToProduct
 *  - If exactly one match → assign image to that product via assignImagesToProduct
 *  - If zero or multiple matches → skip (count as unmatched)
 *
 * Returns { matched, unmatched } counts.
 */
export async function autoMatchAllFolderImages(
  folderPath: string
): Promise<{ matched: number; unmatched: number; error?: string }> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { matched: 0, unmatched: 0, error: "Not authorized" }

  // List all files in the folder
  const result = await listGallery(folderPath)
  if (result.error) return { matched: 0, unmatched: 0, error: result.error }

  const images = result.files.filter((f) => f.type === "image")
  if (images.length === 0) return { matched: 0, unmatched: 0, error: "No images in folder" }

  let matched = 0
  let unmatched = 0

  for (const image of images) {
    // Strip timestamp prefix (e.g. "1710000000000-photo.jpg" → "photo.jpg")
    const cleanName = image.name.replace(/^\d+-/, "") || image.name

    // Run the same matching algorithm
    const matches = await autoMatchFolderToProduct(cleanName)

    if (matches.length === 1) {
      // Single match → auto-assign
      const assignResult = await assignImagesToProduct([image.publicUrl], matches[0].id, null)
      if (assignResult.success) {
        matched++
      } else {
        unmatched++
      }
    } else {
      // Zero or multiple matches → cannot auto-assign
      unmatched++
    }
  }

  // Revalidate after bulk operation
  revalidatePath("/seller/gallery")
  revalidatePath("/seller/products")
  revalidatePath("/seller/gallery/product-images")

  return { matched, unmatched }
}
