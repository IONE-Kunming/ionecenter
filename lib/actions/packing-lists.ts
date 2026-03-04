"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"
import type { PackingList, PackingListItem } from "@/types/database"

export async function getNextPackingListNumber(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return "PKL-0001"

  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from("packing_lists")
    .select("packing_list_number")
    .eq("seller_id", user.id)
    .like("packing_list_number", "PKL-%")

  let maxNum = 0
  for (const row of data ?? []) {
    const match = row.packing_list_number?.match(/^PKL-(\d+)$/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxNum) maxNum = num
    }
  }

  const next = maxNum + 1
  return `PKL-${String(next).padStart(4, "0")}`
}

export interface PackingListItemInput {
  item_code: string
  product_name: string
  quantity: number
  unit: string
  dimensions: string
  net_weight: number
  gross_weight: number
  carton_number: string
}

export interface PackingListInput {
  buyer_name: string
  buyer_email: string
  buyer_code?: string
  packing_list_number?: string
  invoice_id?: string
  items: PackingListItemInput[]
  date?: string
}

export async function createPackingList(input: PackingListInput) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const adminSupabase = createAdminClient()

  let packingListNumber: string
  if (input.packing_list_number) {
    const { data: existing } = await adminSupabase
      .from("packing_lists")
      .select("id")
      .eq("packing_list_number", input.packing_list_number)
      .limit(1)

    if (existing && existing.length > 0) {
      packingListNumber = await getNextPackingListNumber()
    } else {
      packingListNumber = input.packing_list_number
    }
  } else {
    packingListNumber = await getNextPackingListNumber()
  }

  // Calculate totals
  const totalPackages = input.items.reduce((sum, item) => sum + item.quantity, 0)
  const totalNetWeight = input.items.reduce((sum, item) => sum + (item.net_weight * item.quantity), 0)
  const totalGrossWeight = input.items.reduce((sum, item) => sum + (item.gross_weight * item.quantity), 0)

  const { data: packingList, error: plError } = await adminSupabase
    .from("packing_lists")
    .insert({
      packing_list_number: packingListNumber,
      seller_id: user.id,
      buyer_code: input.buyer_code ?? null,
      buyer_name: input.buyer_name,
      buyer_email: input.buyer_email,
      invoice_id: input.invoice_id || null,
      total_packages: totalPackages,
      total_net_weight: Number(totalNetWeight.toFixed(2)),
      total_gross_weight: Number(totalGrossWeight.toFixed(2)),
    })
    .select()
    .single()

  if (plError || !packingList) {
    return { error: plError?.message ?? "Failed to create packing list" }
  }

  // Create packing list items
  if (input.items.length > 0) {
    const plItems = input.items.map((item) => ({
      packing_list_id: packingList.id,
      item_code: item.item_code || null,
      product_name: item.product_name,
      quantity: item.quantity,
      unit: item.unit || null,
      dimensions: item.dimensions || null,
      net_weight: Number(item.net_weight) || 0,
      gross_weight: Number(item.gross_weight) || 0,
      carton_number: item.carton_number || null,
    }))

    const { error: itemsError } = await adminSupabase
      .from("packing_list_items")
      .insert(plItems)

    if (itemsError) return { error: itemsError.message }
  }

  return { success: true, packingList }
}

export async function getSellerPackingLists(): Promise<PackingList[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from("packing_lists")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching seller packing lists:", error)
    return []
  }

  return (data ?? []) as PackingList[]
}

export async function getPackingList(packingListId: string): Promise<(Omit<PackingList, "seller" | "items"> & { items: PackingListItem[]; seller: Record<string, string | null> | null }) | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const adminSupabase = createAdminClient()
  const { data: packingList } = await adminSupabase
    .from("packing_lists")
    .select("*")
    .eq("id", packingListId)
    .single()

  if (!packingList) return null

  // Verify the current user is the seller who owns this packing list
  if (packingList.seller_id !== user.id && user.role !== "admin") {
    return null
  }

  const { data: items } = await adminSupabase
    .from("packing_list_items")
    .select("*")
    .eq("packing_list_id", packingListId)

  // Fetch seller info
  const { data: seller } = await adminSupabase
    .from("users")
    .select("display_name, email, user_code, company")
    .eq("id", packingList.seller_id)
    .single()

  return {
    ...(packingList as PackingList),
    items: (items ?? []) as PackingListItem[],
    seller: seller ?? null,
  }
}

export async function deletePackingList(packingListId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const adminSupabase = createAdminClient()

  // Verify ownership
  const { data: packingList } = await adminSupabase
    .from("packing_lists")
    .select("seller_id")
    .eq("id", packingListId)
    .single()

  if (!packingList || packingList.seller_id !== user.id) {
    return { error: "Packing list not found or not authorized" }
  }

  const { error } = await adminSupabase
    .from("packing_lists")
    .delete()
    .eq("id", packingListId)

  if (error) return { error: error.message }
  return { success: true }
}
