"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"
import type { Branch } from "@/types/database"

export async function getSellerBranches(): Promise<Branch[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("branches")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  return data ?? []
}

export async function createBranch(
  branch: Omit<Branch, "id" | "seller_id" | "created_at" | "updated_at">
) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("branches")
    .insert({ ...branch, seller_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function deleteBranch(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("branches")
    .delete()
    .eq("id", id)
    .eq("seller_id", user.id)

  if (error) return { error: error.message }
  return { success: true }
}
