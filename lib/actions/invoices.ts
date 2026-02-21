"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"
import type { Invoice } from "@/types/database"

export async function getBuyerInvoices(): Promise<Invoice[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("invoices")
    .select("*, seller:users!seller_id(display_name, company)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })

  return (data ?? []).map((inv) => ({
    ...inv,
    seller: inv.seller as unknown as Invoice["seller"],
  }))
}

export async function getSellerInvoices(): Promise<Invoice[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("invoices")
    .select("*, buyer:users!buyer_id(display_name, company)")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  return (data ?? []).map((inv) => ({
    ...inv,
    buyer: inv.buyer as unknown as Invoice["buyer"],
  }))
}

export async function createInvoice(orderId: string) {
  const adminSupabase = createAdminClient()

  // Fetch order with items
  const { data: order, error: orderError } = await adminSupabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single()

  if (orderError || !order) return { error: orderError?.message ?? "Order not found" }

  const { data: items, error: itemsError } = await adminSupabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)

  if (itemsError) return { error: itemsError.message }

  // Generate invoice number via SQL function
  const { data: invoiceNum, error: numError } = await adminSupabase
    .rpc("generate_invoice_number")

  if (numError) return { error: numError.message }

  const invoiceNumber = invoiceNum as string

  // Create invoice record
  const { data: invoice, error: invoiceError } = await adminSupabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      order_id: orderId,
      buyer_id: order.buyer_id,
      seller_id: order.seller_id,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      deposit_paid: order.deposit_amount,
      remaining_balance: order.remaining_balance,
      status: order.remaining_balance > 0 ? "issued" : "paid",
      paid_at: order.remaining_balance <= 0 ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (invoiceError || !invoice) return { error: invoiceError?.message ?? "Failed to create invoice" }

  // Create invoice items
  if (items && items.length > 0) {
    const invoiceItems = items.map((item) => ({
      invoice_id: invoice.id,
      name: item.name,
      quantity: item.quantity,
      unit: "m",
      price: item.price_per_meter ?? (item.quantity > 0 ? item.price / item.quantity : 0),
      subtotal: item.price,
    }))

    const { error: invItemsError } = await adminSupabase
      .from("invoice_items")
      .insert(invoiceItems)

    if (invItemsError) return { error: invItemsError.message }
  }

  return { success: true, invoice }
}

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, buyer:users!buyer_id(*), seller:users!seller_id(*)")
    .eq("id", invoiceId)
    .single()

  if (!invoice) return null

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId)

  return {
    ...invoice,
    buyer: invoice.buyer as unknown as Invoice["buyer"],
    seller: invoice.seller as unknown as Invoice["seller"],
    items: items ?? [],
  }
}
