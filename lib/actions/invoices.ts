"use server"

import { createClient } from "@/lib/supabase/server"
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
