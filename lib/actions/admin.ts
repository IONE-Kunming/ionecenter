"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"
import { generateSKU } from "@/lib/sku"
import { getSiteCategories } from "./site-settings"
import { buildCategoryData } from "@/lib/categories"
import type { User, Product, Order, Invoice } from "@/types/database"

export async function getAdminDashboardStats() {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return null

  const supabase = createAdminClient()

  const [usersResult, productsResult, ordersResult, revenueResult] = await Promise.all([
    supabase
      .from("users")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("total"),
  ])

  const totalRevenue = (revenueResult.data ?? []).reduce(
    (sum, o) => sum + Number(o.total),
    0
  )

  return {
    totalUsers: usersResult.count ?? 0,
    totalProducts: productsResult.count ?? 0,
    totalOrders: ordersResult.count ?? 0,
    totalRevenue,
  }
}

export async function getAllUsers(): Promise<User[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })

  return data ?? []
}

export async function getAllOrders(): Promise<Order[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("orders")
    .select("*, buyer:users!buyer_id(display_name, company), seller:users!seller_id(display_name, company)")
    .order("created_at", { ascending: false })

  return (data ?? []).map((o) => ({
    ...o,
    buyer: o.buyer as unknown as Order["buyer"],
    seller: o.seller as unknown as Order["seller"],
  }))
}

export async function getAllProducts(): Promise<Product[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("products")
    .select("*, seller:users!seller_id(display_name, company)")
    .order("created_at", { ascending: false })

  return (data ?? []).map((p) => ({
    ...p,
    seller_name: (p.seller as unknown as { display_name: string })?.display_name ?? undefined,
  })) as Product[]
}

export async function getAllInvoices(): Promise<Invoice[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("invoices")
    .select("*, buyer:users!buyer_id(display_name, company), seller:users!seller_id(display_name, company)")
    .order("created_at", { ascending: false })

  return (data ?? []).map((i) => ({
    ...i,
    buyer: i.buyer as unknown as Invoice["buyer"],
    seller: i.seller as unknown as Invoice["seller"],
  }))
}

export async function getAllSellers() {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return []

  const supabase = createAdminClient()

  const { data: sellers } = await supabase
    .from("users")
    .select("*")
    .eq("role", "seller")
    .order("created_at", { ascending: false })

  if (!sellers) return []

  // Get product counts per seller
  const { data: products } = await supabase
    .from("products")
    .select("seller_id")

  // Get order counts per seller
  const { data: orders } = await supabase
    .from("orders")
    .select("seller_id")

  const productCounts: Record<string, number> = {}
  const orderCounts: Record<string, number> = {}

  for (const p of products ?? []) {
    productCounts[p.seller_id] = (productCounts[p.seller_id] || 0) + 1
  }
  for (const o of orders ?? []) {
    orderCounts[o.seller_id] = (orderCounts[o.seller_id] || 0) + 1
  }

  return sellers.map((s) => ({
    ...s,
    product_count: productCounts[s.id] || 0,
    order_count: orderCounts[s.id] || 0,
  }))
}

export async function adminBulkUpdateProducts(
  updates: { id: string; name: string; model_number: string; main_category?: string; category?: string; price_per_meter: number; price_usd?: number; price_cny?: number | null; stock: number; is_active?: boolean }[]
) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()

  for (const update of updates) {
    const updateData: Record<string, unknown> = {
      name: update.name,
      model_number: update.model_number,
      price_per_meter: update.price_per_meter,
      price_usd: update.price_usd ?? update.price_per_meter,
      price_cny: update.price_cny ?? null,
      stock: update.stock,
    }
    if (update.main_category !== undefined) {
      updateData.main_category = update.main_category
    }
    if (update.category !== undefined) {
      updateData.category = update.category
    }
    if (update.is_active !== undefined) {
      updateData.is_active = update.is_active
    }
    const { error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", update.id)

    if (error) return { error: error.message }
  }

  return { success: true }
}

export async function adminGetProductsBySeller(sellerId: string): Promise<Product[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })

  return (data ?? []) as Product[]
}

export async function adminDeleteProduct(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function adminBulkImportProducts(
  rows: { name: string; model_number: string; main_category: string; category: string; price_per_meter: number; stock: number; description?: string; image_url?: string; pricing_type?: string; price_usd?: number | null; price_cny?: number | null }[],
  sellerId?: string
) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()

  let targetSellerId = sellerId

  if (!targetSellerId) {
    // Use the first seller found as default
    const { data: sellers } = await supabase
      .from("users")
      .select("id")
      .eq("role", "seller")
      .limit(1)

    targetSellerId = sellers?.[0]?.id ?? user.id
  }

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
    seller_id: targetSellerId,
  }))

  const { error } = await supabase.from("products").insert(insertRows)

  if (error) return { error: error.message }
  return { success: true, count: insertRows.length }
}

// ─── Admin User Management ──────────────────────────────────────────────────

export async function adminUpdateUser(
  userId: string,
  updates: { display_name?: string; email?: string; role?: string; company?: string }
) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()
  const updateData: Record<string, unknown> = {}
  if (updates.display_name !== undefined) updateData.display_name = updates.display_name
  if (updates.email !== undefined) updateData.email = updates.email
  if (updates.role !== undefined) updateData.role = updates.role
  if (updates.company !== undefined) updateData.company = updates.company

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function adminUpdateUserCode(userId: string, code: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const trimmed = code.trim()
  if (!trimmed) return { error: "Code cannot be empty." }

  // Validate format: must start with B or S followed by a number
  if (!/^[BS]\d+$/.test(trimmed)) {
    return { error: "Code must start with B (buyer) or S (seller) followed by a number (e.g. B250, S101)." }
  }

  const supabase = createAdminClient()

  // Check if code is already used by another user
  const { data: existing } = await supabase
    .from("users")
    .select("id, display_name")
    .eq("user_code", trimmed)
    .neq("id", userId)
    .maybeSingle()

  if (existing) {
    return {
      error: `This code is already used for ${existing.display_name}. Please choose a different number.`,
    }
  }

  const { error } = await supabase
    .from("users")
    .update({ user_code: trimmed })
    .eq("id", userId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function adminDeleteUser(userId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", userId)

  if (error) return { error: error.message }
  return { success: true }
}

// ─── Buyers & Sellers Split ─────────────────────────────────────────────────

export async function getAllBuyers(): Promise<User[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("role", "buyer")
    .order("created_at", { ascending: false })

  return data ?? []
}

export interface SellerWithDetails {
  id: string
  display_name: string
  email: string
  role: "seller"
  company: string | null
  user_code: string | null
  created_at: string
  categories: string[]
  assignedCategoryIds: string[]
  buyers: { id: string; display_name: string }[]
}

export async function getSellersWithDetails(): Promise<SellerWithDetails[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return []

  const supabase = createAdminClient()

  // Get all sellers
  const { data: sellers } = await supabase
    .from("users")
    .select("*")
    .eq("role", "seller")
    .order("created_at", { ascending: false })

  if (!sellers || sellers.length === 0) return []

  const sellerIds = sellers.map((s) => s.id)

  // Get assigned categories from seller_categories table
  const { data: sellerCatRows } = await supabase
    .from("seller_categories")
    .select("seller_id, category_id")
    .in("seller_id", sellerIds)

  // Get all site categories to resolve names
  const { data: allSiteCats } = await supabase
    .from("site_categories")
    .select("id, name, parent_id")
    .order("sort_order", { ascending: true })

  const siteCatMap: Record<string, { name: string; parent_id: string | null }> = {}
  for (const c of allSiteCats ?? []) {
    siteCatMap[c.id] = { name: c.name, parent_id: c.parent_id }
  }

  // Get unique buyers from orders for each seller
  const { data: orders } = await supabase
    .from("orders")
    .select("seller_id, buyer_id")
    .in("seller_id", sellerIds)

  // Collect unique buyer IDs
  const allBuyerIds = new Set<string>()
  for (const o of orders ?? []) {
    if (o.buyer_id) allBuyerIds.add(o.buyer_id)
  }

  // Fetch buyer details
  const buyerMap: Record<string, { id: string; display_name: string }> = {}
  if (allBuyerIds.size > 0) {
    const { data: buyers } = await supabase
      .from("users")
      .select("id, display_name")
      .in("id", Array.from(allBuyerIds))

    for (const b of buyers ?? []) {
      buyerMap[b.id] = { id: b.id, display_name: b.display_name }
    }
  }

  // Build per-seller data
  const sellerAssignedCatIds: Record<string, Set<string>> = {}
  const sellerBuyers: Record<string, Set<string>> = {}

  for (const row of sellerCatRows ?? []) {
    if (!sellerAssignedCatIds[row.seller_id]) sellerAssignedCatIds[row.seller_id] = new Set()
    sellerAssignedCatIds[row.seller_id].add(row.category_id)
  }

  for (const o of orders ?? []) {
    if (!sellerBuyers[o.seller_id]) sellerBuyers[o.seller_id] = new Set()
    if (o.buyer_id) sellerBuyers[o.seller_id].add(o.buyer_id)
  }

  return sellers.map((s) => {
    const assignedIds = Array.from(sellerAssignedCatIds[s.id] ?? [])
    // Build display category names from assigned category IDs
    const categoryNames: string[] = []
    for (const catId of assignedIds) {
      const cat = siteCatMap[catId]
      if (cat) categoryNames.push(cat.name)
    }

    return {
      id: s.id,
      display_name: s.display_name,
      email: s.email,
      role: "seller" as const,
      company: s.company,
      user_code: s.user_code,
      created_at: s.created_at,
      categories: categoryNames,
      assignedCategoryIds: assignedIds,
      buyers: Array.from(sellerBuyers[s.id] ?? [])
        .map((buyerId) => buyerMap[buyerId])
        .filter(Boolean),
    }
  })
}

// ─── Seller Category Management ─────────────────────────────────────────────

export async function getSellerCategoryIds(sellerId: string): Promise<string[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("seller_categories")
    .select("category_id")
    .eq("seller_id", sellerId)

  return (data ?? []).map((r) => r.category_id)
}

export async function updateSellerCategories(sellerId: string, categoryIds: string[]) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()

  // Delete existing assignments
  const { error: deleteError } = await supabase
    .from("seller_categories")
    .delete()
    .eq("seller_id", sellerId)

  if (deleteError) return { error: "Failed to clear existing category assignments: " + deleteError.message }

  // Insert new assignments
  if (categoryIds.length > 0) {
    const rows = categoryIds.map((categoryId) => ({
      seller_id: sellerId,
      category_id: categoryId,
    }))
    const { error: insertError } = await supabase
      .from("seller_categories")
      .insert(rows)

    if (insertError) return { error: "Failed to save category assignments: " + insertError.message }
  }

  return { success: true }
}
