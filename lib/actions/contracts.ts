"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"
import type { Contract, ContractItem } from "@/types/database"

export async function getNextContractNumber(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return "CNT-0001"

  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from("contracts")
    .select("contract_number")
    .eq("seller_id", user.id)
    .like("contract_number", "CNT-%")

  let maxNum = 0
  for (const row of data ?? []) {
    const match = row.contract_number?.match(/^CNT-(\d+)$/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxNum) maxNum = num
    }
  }

  const next = maxNum + 1
  return `CNT-${String(next).padStart(4, "0")}`
}

export interface ContractItemInput {
  item_code: string
  product_name: string
  description: string
  quantity: number
  unit_price: number
}

export interface ContractInput {
  buyer_name: string
  buyer_email: string
  buyer_code?: string
  contract_number?: string
  invoice_id?: string
  terms: string
  seller_signature?: string
  buyer_signature?: string
  expiry_date?: string
  items?: ContractItemInput[]
}

export async function createContract(input: ContractInput) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const adminSupabase = createAdminClient()

  let contractNumber: string
  if (input.contract_number) {
    const { data: existing } = await adminSupabase
      .from("contracts")
      .select("id")
      .eq("contract_number", input.contract_number)
      .limit(1)

    if (existing && existing.length > 0) {
      contractNumber = await getNextContractNumber()
    } else {
      contractNumber = input.contract_number
    }
  } else {
    contractNumber = await getNextContractNumber()
  }

  const { data: contract, error: contractError } = await adminSupabase
    .from("contracts")
    .insert({
      contract_number: contractNumber,
      seller_id: user.id,
      buyer_code: input.buyer_code ?? null,
      buyer_name: input.buyer_name,
      buyer_email: input.buyer_email,
      invoice_id: input.invoice_id || null,
      terms: input.terms,
      seller_signature: input.seller_signature ?? null,
      buyer_signature: input.buyer_signature ?? null,
      status: "draft",
      expiry_date: input.expiry_date || null,
    })
    .select()
    .single()

  if (contractError || !contract) {
    return { error: contractError?.message ?? "Failed to create contract" }
  }

  // Create contract items
  if (input.items && input.items.length > 0) {
    const contractItems = input.items.map((item) => ({
      contract_id: contract.id,
      item_code: item.item_code || null,
      product_name: item.product_name,
      description: item.description || null,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      total: Number(item.unit_price) * Number(item.quantity),
    }))

    const { error: itemsError } = await adminSupabase
      .from("contract_items")
      .insert(contractItems)

    if (itemsError) return { error: itemsError.message }
  }

  return { success: true, contract }
}

export async function getSellerContracts(): Promise<Contract[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from("contracts")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching seller contracts:", error)
    return []
  }

  return (data ?? []) as Contract[]
}

export async function getBuyerContracts(): Promise<Contract[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from("contracts")
    .select("*")
    .eq("buyer_email", user.email)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching buyer contracts:", error)
    return []
  }

  return (data ?? []) as Contract[]
}

export async function getContract(contractId: string): Promise<(Omit<Contract, "seller" | "items"> & { items: ContractItem[]; seller: Record<string, string | null> | null }) | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const adminSupabase = createAdminClient()
  const { data: contract } = await adminSupabase
    .from("contracts")
    .select("*")
    .eq("id", contractId)
    .single()

  if (!contract) return null

  // Verify access: seller owns it or buyer email matches
  if (contract.seller_id !== user.id && contract.buyer_email !== user.email && user.role !== "admin") {
    return null
  }

  // Fetch contract items
  const { data: items } = await adminSupabase
    .from("contract_items")
    .select("*")
    .eq("contract_id", contractId)
    .order("created_at")

  // Fetch seller info
  const { data: seller } = await adminSupabase
    .from("users")
    .select("display_name, email, user_code, company")
    .eq("id", contract.seller_id)
    .single()

  return {
    ...(contract as Contract),
    items: (items ?? []) as ContractItem[],
    seller: seller ?? null,
  }
}

export async function deleteContract(contractId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const adminSupabase = createAdminClient()

  // Verify ownership
  const { data: contract } = await adminSupabase
    .from("contracts")
    .select("seller_id")
    .eq("id", contractId)
    .single()

  if (!contract || contract.seller_id !== user.id) {
    return { error: "Contract not found or not authorized" }
  }

  const { error } = await adminSupabase
    .from("contracts")
    .delete()
    .eq("id", contractId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function getSellerOfflineInvoicesForLinking() {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return []

  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from("offline_invoices")
    .select("id, invoice_number, buyer_name, buyer_email")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return data ?? []
}

export async function getSellerAllInvoicesForImport() {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return []

  const adminSupabase = createAdminClient()

  // Fetch from offline_invoices (Buyer Invoices)
  const { data: offlineData } = await adminSupabase
    .from("offline_invoices")
    .select("id, invoice_number, buyer_name, buyer_email, buyer_code, total, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const offlineInvoices = (offlineData ?? []).map((inv) => ({
    ...inv,
    source: "offline" as const,
  }))

  // Fetch from invoices (Order Invoices) with buyer info from users table
  const { data: orderData } = await adminSupabase
    .from("invoices")
    .select("id, invoice_number, buyer_name, buyer_email, total, created_at, buyer:users!buyer_id(user_code)")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const orderInvoices = (orderData ?? []).map((inv) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    buyer_name: inv.buyer_name,
    buyer_email: inv.buyer_email,
    buyer_code: (inv.buyer as unknown as { user_code: string | null })?.user_code ?? null,
    total: inv.total,
    created_at: inv.created_at,
    source: "order" as const,
  }))

  // Combine and sort by created_at descending, limit to 50 total
  const combined = [...offlineInvoices, ...orderInvoices]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50)

  return combined
}

export async function getImportInvoiceItems(invoiceId: string, source: "order" | "offline") {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return []

  const adminSupabase = createAdminClient()

  if (source === "offline") {
    // Verify ownership
    const { data: invoice } = await adminSupabase
      .from("offline_invoices")
      .select("seller_id")
      .eq("id", invoiceId)
      .single()

    if (!invoice || invoice.seller_id !== user.id) return []

    const { data: items } = await adminSupabase
      .from("offline_invoice_items")
      .select("item_code, product_name, description, unit_price, quantity")
      .eq("invoice_id", invoiceId)

    return (items ?? []).map((item) => ({
      item_code: item.item_code || "",
      product_name: item.product_name || "",
      description: item.description || "",
      unit_price: item.unit_price,
      quantity: item.quantity,
    }))
  }

  // source === "order"
  const { data: invoice } = await adminSupabase
    .from("invoices")
    .select("seller_id")
    .eq("id", invoiceId)
    .single()

  if (!invoice || invoice.seller_id !== user.id) return []

  const { data: items } = await adminSupabase
    .from("invoice_items")
    .select("name, description, price, quantity")
    .eq("invoice_id", invoiceId)

  return (items ?? []).map((item) => ({
    item_code: "",
    product_name: item.name || "",
    description: item.description || "",
    unit_price: item.price,
    quantity: item.quantity,
  }))
}
