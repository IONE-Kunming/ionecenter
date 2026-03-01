"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"
import { generateSKU } from "@/lib/sku"
import { getSiteCategories } from "./site-settings"
import { buildCategoryData } from "@/lib/categories"
import type { Product } from "@/types/database"

export async function getProducts(filters?: {
  category?: string
  search?: string
  sellerId?: string
}): Promise<Product[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from("products")
    .select("*, seller:users!seller_id(display_name, is_active)")
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
  return (data ?? [])
    .filter((p) => {
      const seller = p.seller as { display_name: string; is_active: boolean | null } | null
      // Only show products from active sellers (treat missing/null is_active as active for safety)
      return seller === null || seller.is_active !== false
    })
    .map((p) => ({
      ...p,
      seller_name: (p.seller as unknown as { display_name: string })?.display_name,
    }))
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("products")
    .select("*, seller:users!seller_id(display_name, company, city, country, is_active)")
    .eq("id", id)
    .single()

  if (!data) return null

  // Hide products from deactivated sellers
  const seller = data.seller as { display_name: string; company: string | null; city: string | null; country: string | null; is_active: boolean | null } | null
  if (seller && seller.is_active === false) return null

  return {
    ...data,
    seller_name: seller?.display_name,
  }
}

export async function getSellerProducts(): Promise<Product[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return []

  const supabase = createAdminClient()
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

  const supabase = createAdminClient()

  // Auto-generate model number if not provided
  let modelNumber = product.model_number
  if (!modelNumber || !modelNumber.trim()) {
    const siteCategories = await getSiteCategories()
    const categoryData = buildCategoryData(siteCategories)
    modelNumber = `IONE-${generateSKU(categoryData, product.main_category, product.category, Date.now() % 10000)}`
  }

  const { data, error } = await supabase
    .from("products")
    .insert({ ...product, model_number: modelNumber, seller_id: user.id })
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

  const supabase = createAdminClient()
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

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("seller_id", user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function bulkImportProducts(
  rows: { name: string; model_number: string; main_category: string; category: string; price_per_meter: number; stock: number; description?: string; image_url?: string; pricing_type?: string; price_usd?: number | null; price_cny?: number | null }[]
) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const supabase = createAdminClient()

  const siteCategories = await getSiteCategories()
  const categoryData = buildCategoryData(siteCategories)

  const timestamp = Date.now()
  const insertRows = rows.map((row, i) => ({
    name: row.name,
    model_number: row.model_number || `IONE-${generateSKU(categoryData, row.main_category, row.category, timestamp % 10000 + i)}`,
    main_category: row.main_category,
    category: row.category,
    price_per_meter: row.price_per_meter,
    pricing_type: row.pricing_type || "standard",
    price_usd: row.price_usd ?? null,
    price_cny: row.price_cny ?? null,
    stock: row.stock,
    description: row.description ?? null,
    image_url: row.image_url && row.image_url.startsWith("http") ? row.image_url : null,
    seller_id: user.id,
  }))

  const { error } = await supabase.from("products").insert(insertRows)

  if (error) return { error: error.message }
  return { success: true, count: insertRows.length }
}

export async function uploadProductImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }

    const file = formData.get("file") as File
    if (!file) return { error: "No file provided" }

    const supabase = createAdminClient()
    const path = `products/${user.id}/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { contentType: file.type })

    if (error) return { error: error.message }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(data.path)

    return { url: urlData.publicUrl }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed" }
  }
}
