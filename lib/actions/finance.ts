"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "./users"

export interface Transaction {
  id: string
  date: string
  reference: string
  description: string
  account: string
  debit: number
  credit: number
  status: string
  type: string
}

export async function getTransactions(): Promise<Transaction[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()

  let query = supabase
    .from("orders")
    .select("*, buyer:users!buyer_id(display_name, company), seller:users!seller_id(display_name, company)")
    .order("created_at", { ascending: false })

  if (user.role === "buyer") {
    query = query.eq("buyer_id", user.id)
  } else if (user.role === "seller") {
    query = query.eq("seller_id", user.id)
  }

  const { data: orders } = await query
  if (!orders) return []

  return orders.map((order) => {
    const isPaid = order.payment_status === "paid"
    const isDeposit = order.payment_status === "deposit_paid"
    const isBuyer = user.role === "buyer"

    return {
      id: order.id,
      date: order.created_at,
      reference: `ORD-${order.id.slice(0, 8).toUpperCase()}`,
      description: isBuyer
        ? `Order from ${(order.seller as any)?.company ?? "seller"}`
        : `Order by ${(order.buyer as any)?.company ?? "buyer"}`,
      account: isBuyer
        ? (isPaid || isDeposit ? "Expenses" : "Accounts Payable")
        : (isPaid || isDeposit ? "Revenue" : "Accounts Receivable"),
      debit: isBuyer ? Number(order.total) : 0,
      credit: isBuyer ? 0 : Number(order.total),
      status: isPaid ? "completed" : isDeposit ? "pending" : "draft",
      type: isBuyer ? "expense" : "sale",
    }
  })
}
