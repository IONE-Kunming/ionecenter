"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"
import type { Contract } from "@/types/database"

export async function getNextContractNumber(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return "CNT-0001"

  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from("contracts")
    .select("contract_number")
    .order("created_at", { ascending: false })
    .limit(1)

  const parsed = data?.[0]?.contract_number
    ? parseInt((data[0].contract_number as string).replace("CNT-", ""))
    : 0
  const lastNumber = isNaN(parsed) ? 0 : parsed
  const newNumber = `CNT-${String(lastNumber + 1).padStart(4, "0")}`
  return newNumber
}

export interface ContractInput {
  buyer_name: string
  buyer_email: string
  buyer_code?: string
  buyer_company_name?: string
  seller_company_name?: string
  contract_number?: string
  terms: string
  seller_signature?: string
  buyer_signature?: string
  expiry_date?: string
}

export async function createContract(input: ContractInput) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const adminSupabase = createAdminClient()

  // Retry loop: generate a unique contract number and attempt insert
  const maxAttempts = 10
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Query the latest contract number across all sellers
    const { data } = await adminSupabase
      .from("contracts")
      .select("contract_number")
      .order("created_at", { ascending: false })
      .limit(1)

    const parsed = data?.[0]?.contract_number
      ? parseInt((data[0].contract_number as string).replace("CNT-", ""))
      : 0
    const lastNumber = isNaN(parsed) ? 0 : parsed
    const contractNumber = `CNT-${String(lastNumber + 1).padStart(4, "0")}`

    const { data: contract, error: contractError } = await adminSupabase
      .from("contracts")
      .insert({
        contract_number: contractNumber,
        seller_id: user.id,
        buyer_code: input.buyer_code ?? null,
        buyer_name: input.buyer_name,
        buyer_email: input.buyer_email,
        buyer_company_name: input.buyer_company_name || null,
        seller_company_name: input.seller_company_name || null,
        terms: input.terms,
        seller_signature: input.seller_signature ?? null,
        buyer_signature: input.buyer_signature ?? null,
        status: "draft",
        expiry_date: input.expiry_date || null,
      })
      .select()
      .single()

    if (!contractError && contract) {
      return { success: true, contract }
    }

    // If it's a duplicate key error, retry with a new number
    if (contractError?.code === "23505") {
      continue
    }

    // For any other error, return immediately
    return { error: contractError?.message ?? "Failed to create contract" }
  }

  return { error: "Failed to generate unique contract number after multiple attempts" }
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

export async function getContract(contractId: string): Promise<(Omit<Contract, "seller"> & { seller: Record<string, string | null> | null }) | null> {
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

  // Fetch seller info
  const { data: seller } = await adminSupabase
    .from("users")
    .select("display_name, email, user_code, company")
    .eq("id", contract.seller_id)
    .single()

  return {
    ...(contract as Contract),
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
