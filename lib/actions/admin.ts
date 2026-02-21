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
