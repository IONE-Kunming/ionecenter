"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"
import type { Invoice, OfflineInvoice, OfflineInvoiceItem } from "@/types/database"

export async function getBuyerInvoices(): Promise<Invoice[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createAdminClient()
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

  const supabase = createAdminClient()
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
      price: item.price_per_meter ?? (item.quantity > 0 ? Number((item.price / item.quantity).toFixed(2)) : 0),
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

  const supabase = createAdminClient()
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

export async function searchSellerProducts(query: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("products")
    .select("id, name, model_number, description, price_per_meter, price_usd")
    .eq("seller_id", user.id)
    .eq("is_active", true)
    .or(`model_number.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(10)

  return data ?? []
}

export async function getSellerBankInfo() {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return null

  return {
    account_name: user.account_name,
    account_number: user.account_number,
    swift_code: user.swift_code,
    bank_name: user.bank_name,
    bank_region: user.bank_region,
    bank_code: user.bank_code,
    branch_code: user.branch_code,
    bank_address: user.bank_address,
    company: user.company,
    display_name: user.display_name,
    email: user.email,
    user_code: user.user_code,
    phone_number: user.phone_number,
    street: user.street,
    city: user.city,
    state: user.state,
    country: user.country,
  }
}

export async function searchBuyers(query: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return []

  const safe = query.replace(/[%_\\]/g, "")
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from("users")
    .select("id, display_name, email, user_code")
    .eq("role", "buyer")
    .or(`display_name.ilike.%${safe}%,email.ilike.%${safe}%,user_code.ilike.%${safe}%`)
    .limit(10)

  return data ?? []
}

export async function getSellerRecentBuyers() {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return []

  const adminSupabase = createAdminClient()
  const { data: sellerBuyers } = await adminSupabase
    .from("seller_buyers")
    .select("buyer_id, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  if (!sellerBuyers || sellerBuyers.length === 0) return []

  const buyerIds = sellerBuyers.map((sb) => sb.buyer_id)
  const { data: buyers } = await adminSupabase
    .from("users")
    .select("id, display_name, email, user_code")
    .in("id", buyerIds)

  if (!buyers) return []

  // Preserve the order from seller_buyers (most recent first)
  const buyerMap = new Map(buyers.map((b) => [b.id, b]))
  return buyerIds.map((id) => buyerMap.get(id)).filter(Boolean) as {
    id: string
    display_name: string
    email: string
    user_code: string | null
  }[]
}

export async function saveSellerBuyer(buyerId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const adminSupabase = createAdminClient()

  // Upsert: if already exists, update created_at to move it to the top of recents
  const { error } = await adminSupabase
    .from("seller_buyers")
    .upsert(
      { seller_id: user.id, buyer_id: buyerId, created_at: new Date().toISOString() },
      { onConflict: "seller_id,buyer_id" }
    )

  if (error) return { error: error.message }
  return { success: true }
}

export async function searchBuyerByCode(buyerCode: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return null

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from("users")
    .select("id, email, user_code, display_name, account_name, account_number, swift_code, bank_name, bank_region, bank_code, branch_code, bank_address")
    .ilike("user_code", buyerCode.trim().replace(/[%_]/g, ""))
    .limit(1)

  if (error || !data || data.length === 0) {
    return null
  }

  return data[0]
}

export async function getNextSellerInvoiceNumber(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return "INV-0001"

  const adminSupabase = createAdminClient()

  // Check both tables for existing invoice numbers
  const { data: invoicesData } = await adminSupabase
    .from("invoices")
    .select("invoice_number")
    .eq("seller_id", user.id)
    .like("invoice_number", "INV-%")

  const { data: offlineData } = await adminSupabase
    .from("offline_invoices")
    .select("invoice_number")
    .eq("seller_id", user.id)
    .like("invoice_number", "INV-%")

  let maxNum = 0
  const allRows = [...(invoicesData ?? []), ...(offlineData ?? [])]
  for (const row of allRows) {
    const match = row.invoice_number?.match(/^INV-(\d+)$/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxNum) maxNum = num
    }
  }

  const next = maxNum + 1
  return `INV-${String(next).padStart(4, "0")}`
}

export interface OfflineInvoiceInput {
  buyer_name: string
  buyer_email: string
  buyer_code?: string
  invoice_number?: string
  items: {
    name: string
    description: string
    unit_price: number
    quantity: number
    item_code?: string
  }[]
  discount: number
  amount_paid: number
}

export async function createOfflineInvoice(input: OfflineInvoiceInput) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const adminSupabase = createAdminClient()

  let invoiceNumber: string

  if (input.invoice_number) {
    // Validate the provided number doesn't already exist in offline_invoices
    const { data: existing } = await adminSupabase
      .from("offline_invoices")
      .select("id")
      .eq("invoice_number", input.invoice_number)
      .limit(1)

    if (existing && existing.length > 0) {
      const freshNumber = await getNextSellerInvoiceNumber()
      invoiceNumber = freshNumber
    } else {
      invoiceNumber = input.invoice_number
    }
  } else {
    invoiceNumber = await getNextSellerInvoiceNumber()
  }

  // Calculate totals
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  )
  const discount = input.discount
  const total = Math.max(subtotal - discount, 0)
  const amountPaid = input.amount_paid
  const amountDue = Math.max(total - amountPaid, 0)

  const { data: invoice, error: invoiceError } = await adminSupabase
    .from("offline_invoices")
    .insert({
      invoice_number: invoiceNumber,
      seller_id: user.id,
      buyer_code: input.buyer_code ?? null,
      buyer_name: input.buyer_name,
      buyer_email: input.buyer_email,
      subtotal,
      discount,
      total,
      amount_paid: amountPaid,
      amount_due: amountDue,
      status: amountDue <= 0 ? "paid" : "unpaid",
    })
    .select()
    .single()

  if (invoiceError || !invoice)
    return { error: invoiceError?.message ?? "Failed to create invoice" }

  // Create offline invoice items
  if (input.items.length > 0) {
    const invoiceItems = input.items.map((item) => ({
      invoice_id: invoice.id,
      item_code: item.item_code ?? null,
      product_name: item.name,
      description: item.description,
      unit_price: item.unit_price,
      quantity: item.quantity,
      total: Number((item.unit_price * item.quantity).toFixed(2)),
    }))

    const { error: itemsError } = await adminSupabase
      .from("offline_invoice_items")
      .insert(invoiceItems)

    if (itemsError) return { error: itemsError.message }
  }

  return { success: true, invoice }
}

export async function getOfflineInvoice(invoiceId: string): Promise<(OfflineInvoice & { items: OfflineInvoiceItem[]; seller: Record<string, string | null> | null; buyer_bank: Record<string, string | null> | null }) | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createAdminClient()
  const { data: invoice } = await supabase
    .from("offline_invoices")
    .select("*")
    .eq("id", invoiceId)
    .single()

  if (!invoice) return null

  // Verify the current user is the seller who owns this invoice
  if (invoice.seller_id !== user.id) return null

  const { data: items } = await supabase
    .from("offline_invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId)

  // Fetch seller bank info + user_code + email
  const { data: seller } = await supabase
    .from("users")
    .select("display_name, email, user_code, company, account_name, account_number, swift_code, bank_name, bank_region, bank_code, branch_code, bank_address")
    .eq("id", invoice.seller_id)
    .single()

  // Fetch buyer bank info by buyer_code (if available)
  let buyerBank: Record<string, string | null> | null = null
  if (invoice.buyer_code) {
    const { data: buyerData } = await supabase
      .from("users")
      .select("account_name, account_number, swift_code, bank_name, bank_region, bank_code, branch_code, bank_address")
      .ilike("user_code", invoice.buyer_code.trim().replace(/[%_]/g, ""))
      .limit(1)
    if (buyerData && buyerData.length > 0) {
      const b = buyerData[0]
      if (b.account_name || b.account_number || b.bank_name) {
        buyerBank = b
      }
    }
  }

  return {
    ...(invoice as OfflineInvoice),
    items: (items ?? []) as OfflineInvoiceItem[],
    seller: seller ?? null,
    buyer_bank: buyerBank,
  }
}

export async function getSellerOfflineInvoices(): Promise<OfflineInvoice[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("offline_invoices")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  return (data ?? []) as OfflineInvoice[]
}

export async function updateOfflineInvoice(invoiceId: string, input: OfflineInvoiceInput) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const adminSupabase = createAdminClient()

  // Verify ownership
  const { data: existing } = await adminSupabase
    .from("offline_invoices")
    .select("id, seller_id")
    .eq("id", invoiceId)
    .single()

  if (!existing || existing.seller_id !== user.id) {
    return { error: "Invoice not found or not authorized" }
  }

  // Calculate totals
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  )
  const discount = input.discount
  const total = Math.max(subtotal - discount, 0)
  const amountPaid = input.amount_paid
  const amountDue = Math.max(total - amountPaid, 0)

  const { data: invoice, error: invoiceError } = await adminSupabase
    .from("offline_invoices")
    .update({
      buyer_code: input.buyer_code ?? null,
      buyer_name: input.buyer_name,
      buyer_email: input.buyer_email,
      subtotal,
      discount,
      total,
      amount_paid: amountPaid,
      amount_due: amountDue,
      status: amountDue <= 0 ? "paid" : "unpaid",
    })
    .eq("id", invoiceId)
    .select()
    .single()

  if (invoiceError || !invoice)
    return { error: invoiceError?.message ?? "Failed to update invoice" }

  // Delete old items and insert new ones
  const { error: deleteError } = await adminSupabase
    .from("offline_invoice_items")
    .delete()
    .eq("invoice_id", invoiceId)

  if (deleteError) return { error: deleteError.message }

  if (input.items.length > 0) {
    const invoiceItems = input.items.map((item) => ({
      invoice_id: invoiceId,
      item_code: item.item_code ?? null,
      product_name: item.name,
      description: item.description,
      unit_price: item.unit_price,
      quantity: item.quantity,
      total: Number((item.unit_price * item.quantity).toFixed(2)),
    }))

    const { error: itemsError } = await adminSupabase
      .from("offline_invoice_items")
      .insert(invoiceItems)

    if (itemsError) return { error: itemsError.message }
  }

  return { success: true, invoice }
}

export async function deleteOfflineInvoice(invoiceId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const adminSupabase = createAdminClient()

  // Verify ownership
  const { data: invoice } = await adminSupabase
    .from("offline_invoices")
    .select("id, seller_id")
    .eq("id", invoiceId)
    .single()

  if (!invoice || invoice.seller_id !== user.id) {
    return { error: "Invoice not found or not authorized" }
  }

  const { error } = await adminSupabase
    .from("offline_invoices")
    .delete()
    .eq("id", invoiceId)

  if (error) return { error: error.message }

  return { success: true }
}
