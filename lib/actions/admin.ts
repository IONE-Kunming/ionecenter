"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser, generateUniqueSellerCode } from "./users"
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

// ─── Admin Create Seller ────────────────────────────────────────────────────

export async function adminCreateSeller(input: {
  fullName: string
  email: string
  password: string
  company: string
  mainCategory: string | null
  subcategories: string[]
}): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  if (!input.fullName.trim()) return { error: "Full name is required" }
  if (!input.email.trim()) return { error: "Email is required" }
  if (!input.password || input.password.length < 8) return { error: "Password must be at least 8 characters" }

  // Split full name into first/last for Clerk
  const nameParts = input.fullName.trim().split(/\s+/)
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(" ") || undefined

  let clerkUserId: string
  try {
    const client = await clerkClient()
    const clerkUser = await client.users.createUser({
      emailAddress: [input.email.trim()],
      password: input.password,
      firstName,
      lastName,
      publicMetadata: { role: "seller" },
    })
    clerkUserId = clerkUser.id
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create Clerk account"
    return { error: message }
  }

  const supabase = createAdminClient()
  const sellerCode = await generateUniqueSellerCode(supabase)

  const { data: newUser, error: dbError } = await supabase
    .from("users")
    .insert({
      clerk_id: clerkUserId,
      email: input.email.trim(),
      display_name: input.fullName.trim(),
      role: "seller",
      company: input.company.trim() || null,
      user_code: sellerCode,
    })
    .select()
    .single()

  if (dbError) {
    // Attempt to clean up the orphaned Clerk account
    try {
      const client = await clerkClient()
      await client.users.deleteUser(clerkUserId)
    } catch {
      // Cleanup failed — admin may need to manually remove the Clerk account
    }
    return { error: "Failed to save seller to database: " + dbError.message }
  }

  // Save category if provided
  if (input.mainCategory && newUser) {
    const { error: catError } = await supabase
      .from("seller_categories")
      .insert({
        seller_id: newUser.id,
        main_category: input.mainCategory,
        subcategories: input.subcategories,
      })
    if (catError) {
      console.error("Failed to save seller category:", catError)
    }
  }

  return { success: true }
}

// ─── Admin Update Seller in Clerk ───────────────────────────────────────────

export async function adminUpdateSellerClerk(
  userId: string,
  updates: { display_name?: string; email?: string }
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()
  const { data: targetUser } = await supabase
    .from("users")
    .select("clerk_id")
    .eq("id", userId)
    .single()

  if (!targetUser?.clerk_id) return { error: "User not found" }

  try {
    const client = await clerkClient()
    const clerkUpdates: Record<string, unknown> = {}
    if (updates.display_name) {
      const nameParts = updates.display_name.trim().split(/\s+/)
      clerkUpdates.firstName = nameParts[0]
      clerkUpdates.lastName = nameParts.slice(1).join(" ") || undefined
    }
    if (updates.email) {
      // Create a new email address and set it as primary
      const clerkUser = await client.users.getUser(targetUser.clerk_id)
      const currentPrimary = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )
      if (currentPrimary && currentPrimary.emailAddress !== updates.email.trim()) {
        const newEmail = await client.emailAddresses.createEmailAddress({
          userId: targetUser.clerk_id,
          emailAddress: updates.email.trim(),
          verified: true,
          primary: true,
        })
        // Delete the old email address
        if (currentPrimary.id !== newEmail.id) {
          await client.emailAddresses.deleteEmailAddress(currentPrimary.id)
        }
      }
    }
    if (clerkUpdates.firstName !== undefined) {
      await client.users.updateUser(targetUser.clerk_id, clerkUpdates)
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update Clerk account"
    console.error("Clerk update error:", err)
    return { error: message }
  }

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
  logo_url: string | null
  created_at: string
  main_category: string | null
  subcategories: string[]
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

  // Get seller categories (new schema: one row per seller with main_category + subcategories)
  const { data: sellerCatRows } = await supabase
    .from("seller_categories")
    .select("seller_id, main_category, subcategories")
    .in("seller_id", sellerIds)

  const sellerCatMap: Record<string, { main_category: string; subcategories: string[] }> = {}
  for (const row of sellerCatRows ?? []) {
    sellerCatMap[row.seller_id] = {
      main_category: row.main_category,
      subcategories: row.subcategories ?? [],
    }
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

  const sellerBuyers: Record<string, Set<string>> = {}
  for (const o of orders ?? []) {
    if (!sellerBuyers[o.seller_id]) sellerBuyers[o.seller_id] = new Set()
    if (o.buyer_id) sellerBuyers[o.seller_id].add(o.buyer_id)
  }

  return sellers.map((s) => {
    const catData = sellerCatMap[s.id]
    return {
      id: s.id,
      display_name: s.display_name,
      email: s.email,
      role: "seller" as const,
      company: s.company,
      user_code: s.user_code,
      logo_url: s.logo_url ?? null,
      created_at: s.created_at,
      main_category: catData?.main_category ?? null,
      subcategories: catData?.subcategories ?? [],
      buyers: Array.from(sellerBuyers[s.id] ?? [])
        .map((buyerId) => buyerMap[buyerId])
        .filter(Boolean),
    }
  })
}

// ─── Seller Category Management ─────────────────────────────────────────────

export async function adminUpdateSellerCategories(
  sellerId: string,
  mainCategory: string,
  subcategories: string[]
) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from("seller_categories")
    .upsert(
      {
        seller_id: sellerId,
        main_category: mainCategory,
        subcategories,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "seller_id" }
    )

  if (error) return { error: error.message }
  return { success: true }
}

export async function adminClearSellerCategories(sellerId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from("seller_categories")
    .delete()
    .eq("seller_id", sellerId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function adminDeleteProductsByRemovedCategories(
  sellerId: string,
  oldMainCategory: string | null,
  newMainCategory: string | null,
  removedSubcategories: string[]
) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()

  // If main category changed, delete all products from old main category
  if (oldMainCategory && oldMainCategory !== newMainCategory) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("seller_id", sellerId)
      .eq("main_category", oldMainCategory)

    if (error) return { error: "Failed to delete products: " + error.message }
  }

  // If subcategories were removed (same main category), delete products in those subcategories
  if (oldMainCategory === newMainCategory && removedSubcategories.length > 0) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("seller_id", sellerId)
      .in("category", removedSubcategories)

    if (error) return { error: "Failed to delete products: " + error.message }
  }

  return { success: true }
}

// ─── Transfer Products Between Sellers ──────────────────────────────────────

export async function adminGetSellerProductCount(sellerId: string): Promise<number> {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return 0

  const supabase = createAdminClient()
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", sellerId)

  return count ?? 0
}

export async function adminTransferProducts(
  sourceSellerId: string,
  targetSellerId: string
): Promise<{ error?: string; transferred?: number }> {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  if (sourceSellerId === targetSellerId) return { error: "Source and target seller cannot be the same" }

  const supabase = createAdminClient()

  // Count products first
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", sourceSellerId)

  if (!count || count === 0) return { error: "No products to transfer" }

  // Update seller_id for all products of source seller
  const { error } = await supabase
    .from("products")
    .update({ seller_id: targetSellerId, updated_at: new Date().toISOString() })
    .eq("seller_id", sourceSellerId)

  if (error) return { error: "Failed to transfer products: " + error.message }

  return { transferred: count }
}

// ─── Export Seller Products ─────────────────────────────────────────────────

export async function adminGetSellerProducts(sellerId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("products")
    .select("name, model_number, category, price_usd, price_cny, stock")
    .eq("seller_id", sellerId)
    .order("name")

  return data ?? []
}
