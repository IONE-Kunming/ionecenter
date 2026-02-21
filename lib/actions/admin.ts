"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "./users"
import type { User, Product, Order, Invoice } from "@/types/database"

export async function getAdminDashboardStats() {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return null

  const supabase = await createClient()

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

  const supabase = await createClient()
  const { data } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })

  return data ?? []
}

export async function getAllOrders(): Promise<Order[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return []

  const supabase = await createClient()
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

  const supabase = await createClient()
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

  const supabase = await createClient()
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

  const supabase = await createClient()

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
