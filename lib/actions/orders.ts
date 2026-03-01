"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"
import { calculateOrderTotals, TAX_RATE } from "@/lib/utils"
import { createInvoice } from "./invoices"
import type { Order, OrderItem, CartItem, PaymentMethod } from "@/types/database"

export async function getBuyerOrders(): Promise<Order[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createAdminClient()
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

  const supabase = createAdminClient()
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

  const supabase = createAdminClient()
  const { data: order } = await supabase
    .from("orders")
    .select("*, buyer:users!buyer_id(*), seller:users!seller_id(*)")
    .eq("id", id)
    .single()

  if (!order) return null

  // Ensure the current user is the buyer, seller, or admin
  const isParticipant =
    order.buyer_id === user.id ||
    order.seller_id === user.id ||
    user.role === "admin"
  if (!isParticipant) return null

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

const VALID_ORDER_STATUSES = ["pending", "under_review", "confirmed", "in_production", "out_of_production", "shipped", "arrived_at_port", "delivered"] as const

export async function updateOrderStatus(id: string, status: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  if (!VALID_ORDER_STATUSES.includes(status as typeof VALID_ORDER_STATUSES[number])) {
    return { error: "Invalid order status" }
  }

  const supabase = createAdminClient()

  // Verify the user has permission to update this order
  const { data: order } = await supabase
    .from("orders")
    .select("buyer_id, seller_id")
    .eq("id", id)
    .single()

  if (!order) return { error: "Order not found" }

  const isParticipant =
    order.buyer_id === user.id ||
    order.seller_id === user.id ||
    user.role === "admin"
  if (!isParticipant) return { error: "Not authorized" }

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

  const supabase = createAdminClient()

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
      .in("status", ["pending", "under_review", "confirmed", "in_production"]),
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

  const supabase = createAdminClient()

  const [productsResult, ordersResult, revenueResult] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", user.id),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", user.id)
      .in("status", ["pending", "under_review", "confirmed", "in_production", "out_of_production", "shipped"]),
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

export async function createOrdersFromCart(
  cartItems: CartItem[],
  depositPercentage: number,
  paymentMethod: PaymentMethod
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  if (cartItems.length === 0) return { error: "Cart is empty" }

  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // Fetch products to determine seller for each item
  const productIds = cartItems.map((item) => item.product_id)
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, seller_id, name, model_number, category, price_per_meter, image_url")
    .in("id", productIds)

  if (productsError || !products) return { error: "Failed to fetch product details" }

  const productMap = new Map(products.map((p) => [p.id, p]))

  // Group cart items by seller
  const itemsBySeller = new Map<string, (CartItem & { product: typeof products[0] })[]>()
  for (const item of cartItems) {
    const product = productMap.get(item.product_id)
    if (!product) continue
    const sellerId = product.seller_id
    if (!itemsBySeller.has(sellerId)) itemsBySeller.set(sellerId, [])
    itemsBySeller.get(sellerId)!.push({ ...item, product })
  }

  const createdOrderIds: string[] = []

  for (const [sellerId, items] of itemsBySeller) {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totals = calculateOrderTotals(subtotal, depositPercentage)

    const paymentStatus = depositPercentage >= 100 ? "paid" : "deposit_paid"

    const { data: order, error: orderError } = await adminSupabase
      .from("orders")
      .insert({
        buyer_id: user.id,
        seller_id: sellerId,
        subtotal: totals.subtotal,
        tax: totals.tax,
        tax_rate: TAX_RATE,
        total: totals.total,
        deposit_amount: totals.depositAmount,
        deposit_percentage: depositPercentage,
        remaining_balance: totals.remainingBalance,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        status: "pending",
      })
      .select()
      .single()

    if (orderError || !order) return { error: orderError?.message ?? "Failed to create order" }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      name: item.product.name,
      model_number: item.product.model_number,
      category: item.product.category,
      quantity: item.quantity,
      price: item.price * item.quantity,
      price_per_meter: item.product.price_per_meter,
      image_url: item.product.image_url,
    }))

    const { error: itemsError } = await adminSupabase
      .from("order_items")
      .insert(orderItems)

    if (itemsError) return { error: itemsError.message }

    // Create invoice for deposit using admin client (bypasses RLS)
    await createInvoice(order.id)

    createdOrderIds.push(order.id)
  }

  // Clear the cart
  await adminSupabase
    .from("carts")
    .update({ items: [] })
    .eq("user_id", user.id)

  return { success: true, orderIds: createdOrderIds }
}

export async function processRemainingPayment(orderId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const supabase = createAdminClient()

  const { error: orderError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      remaining_balance: 0,
    })
    .eq("id", orderId)
    .eq("buyer_id", user.id)

  if (orderError) return { error: orderError.message }

  // Update related invoice status to paid
  const { error: invoiceError } = await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("order_id", orderId)

  if (invoiceError) return { error: invoiceError.message }

  return { success: true }
}
