"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"
import { generateSKU } from "@/lib/sku"
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
  updates: { id: string; name: string; model_number: string; price_per_meter: number; stock: number; is_active?: boolean }[]
) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()

  for (const update of updates) {
    const updateData: Record<string, unknown> = {
      name: update.name,
      model_number: update.model_number,
      price_per_meter: update.price_per_meter,
      stock: update.stock,
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
  rows: { name: string; model_number: string; main_category: string; category: string; price_per_meter: number; stock: number; description?: string; image_url?: string }[],
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

  const timestamp = Date.now()
  const insertRows = rows.map((row, i) => ({
    name: row.name,
    model_number: row.model_number || `IONE-${generateSKU(row.main_category, row.category, timestamp % 10000 + i)}`,
    main_category: row.main_category,
    category: row.category,
    price_per_meter: row.price_per_meter,
    stock: row.stock,
    description: row.description ?? null,
    image_url: row.image_url ?? null,
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

export async function adminDeactivateUser(userId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("users")
    .update({ role: "deactivated" as string })
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
