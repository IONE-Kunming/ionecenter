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

  // Always generate a fresh unique contract number right before insert
  // Fetch all existing contract numbers for this seller
  const { data: existingContracts, error: fetchError } = await adminSupabase
    .from("contracts")
    .select("contract_number")
    .eq("seller_id", user.id)
    .like("contract_number", "CNT-%")

  if (fetchError) {
    return { error: "Failed to check existing contract numbers" }
  }

  const existingNumbers = new Set<string>()
  let maxNum = 0
  for (const row of existingContracts ?? []) {
    const cn = row.contract_number as string | null
    if (cn) {
      existingNumbers.add(cn)
      const match = cn.match(/^CNT-(\d+)$/)
      if (match) {
        const n = parseInt(match[1], 10)
        if (n > maxNum) maxNum = n
      }
    }
  }

  // Find the next number that does not already exist
  let next = maxNum + 1
  let contractNumber = `CNT-${String(next).padStart(4, "0")}`
  const maxAttempts = 100
  let attempts = 0
  while (existingNumbers.has(contractNumber)) {
    if (++attempts >= maxAttempts) {
      return { error: "Failed to generate unique contract number" }
    }
    next++
    contractNumber = `CNT-${String(next).padStart(4, "0")}`
  }

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

  if (contractError || !contract) {
    return { error: contractError?.message ?? "Failed to create contract" }
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
