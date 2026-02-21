"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "./users"
import type { Order, OrderItem } from "@/types/database"

export async function getBuyerOrders(): Promise<Order[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("orders")
    .select("*, seller:users!seller_id(display_name, company)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })

  return (data ?? []).map((o) => ({
    ...o,
    seller: o.seller as unknown as Order["seller"],
  }))
}

export async function getSellerOrders(): Promise<Order[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("orders")
    .select("*, buyer:users!buyer_id(display_name, company)")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  return (data ?? []).map((o) => ({
    ...o,
    buyer: o.buyer as unknown as Order["buyer"],
  }))
}

export async function getOrder(id: string): Promise<(Order & { items: OrderItem[] }) | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: order } = await supabase
    .from("orders")
    .select("*, buyer:users!buyer_id(*), seller:users!seller_id(*)")
    .eq("id", id)
    .single()

  if (!order) return null

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id)

  return {
    ...order,
    buyer: order.buyer as unknown as Order["buyer"],
    seller: order.seller as unknown as Order["seller"],
    items: items ?? [],
  }
}

export async function updateOrderStatus(id: string, status: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function getBuyerDashboardStats() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()

  const [ordersResult, spendingResult, pendingResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", user.id),
    supabase
      .from("orders")
      .select("total")
      .eq("buyer_id", user.id),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", user.id)
      .in("status", ["pending", "processing"]),
  ])

  const totalSpending = (spendingResult.data ?? []).reduce(
    (sum, o) => sum + Number(o.total),
    0
  )

  return {
    totalOrders: ordersResult.count ?? 0,
    totalSpending,
    pendingOrders: pendingResult.count ?? 0,
  }
}

export async function getSellerDashboardStats() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()

  const [productsResult, ordersResult, revenueResult] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", user.id),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", user.id)
      .in("status", ["pending", "processing", "shipped"]),
    supabase
      .from("orders")
      .select("total")
      .eq("seller_id", user.id),
  ])

  const totalRevenue = (revenueResult.data ?? []).reduce(
    (sum, o) => sum + Number(o.total),
    0
  )

  return {
    totalProducts: productsResult.count ?? 0,
    activeOrders: ordersResult.count ?? 0,
    totalRevenue,
  }
}
