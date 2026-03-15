"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { User } from "@/types/database"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Generate a unique seller code in the format S### (e.g. S101, S204).
 * Retries until a unique code is found.
 */
export async function generateUniqueSellerCode(supabase: SupabaseClient): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const num = Math.floor(100 + Math.random() * 900) // 100–999
    const code = `S${num}`
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("user_code", code)
      .maybeSingle()
    if (!existing) return code
  }
  // Fallback: use timestamp-based 3-digit code
  const fallback = `S${(Date.now() % 900) + 100}`
  return fallback
}

/**
 * Generate a unique buyer code in the format B### (e.g. B250, B103).
 * Retries until a unique code is found.
 */
export async function generateUniqueBuyerCode(supabase: SupabaseClient): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const num = Math.floor(100 + Math.random() * 900) // 100–999
    const code = `B${num}`
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("user_code", code)
      .maybeSingle()
    if (!existing) return code
  }
  // Fallback: use timestamp-based 3-digit code
  const fallback = `B${(Date.now() % 900) + 100}`
  return fallback
}

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", userId)
    .single()

  return data
}

export async function ensureUserInSupabase(): Promise<User | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", userId)
    .single()

  if (existing) return existing

  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? ""
  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email
  const role = (clerkUser.publicMetadata?.role as string) || "buyer"

  const insertData: Record<string, unknown> = {
    clerk_id: userId,
    email,
    display_name: displayName,
    role,
  }

  if (role === "buyer") {
    insertData.user_code = await generateUniqueBuyerCode(supabase)
  }

  const { data, error } = await supabase
    .from("users")
    .upsert(insertData, { onConflict: "clerk_id" })
    .select()
    .single()

  if (error) {
    console.error("Failed to sync user to Supabase:", error)
    return null
  }

  return data
}

export async function updateUserProfile(
  updates: Partial<Pick<User, "display_name" | "company" | "phone_number" | "preferred_language" | "street" | "city" | "state" | "zip" | "country" | "bank_name" | "account_name" | "account_number" | "swift_code" | "bank_branch" | "bank_region" | "bank_code" | "branch_code" | "bank_address" | "currency" | "payment_notes">>
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)

  if (error) return { error: error.message }

  return { success: true }
}

export async function getSellers(): Promise<User[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("role", "seller")
    .eq("is_active", true)
    .order("display_name")

  return data ?? []
}

/**
 * Ensure the current buyer has a unique user_code.
 * If the buyer has no code yet, generate one in the format B### and persist it.
 * Returns the (possibly freshly-generated) user_code.
 */
export async function ensureBuyerCode(user: User): Promise<string | null> {
  if (user.user_code) return user.user_code

  const supabase = createAdminClient()
  const code = await generateUniqueBuyerCode(supabase)
  const { error } = await supabase
    .from("users")
    .update({ user_code: code })
    .eq("id", user.id)

  if (error) {
    console.error("Failed to generate buyer code:", error)
    return null
  }
  return code
}

/**
 * Ensure the current seller has a unique user_code.
 * If the seller has no code yet, generate one in the format S### and persist it.
 * Returns the (possibly freshly-generated) user_code.
 */
export async function ensureSellerCode(user: User): Promise<string | null> {
  if (user.user_code) return user.user_code

  const supabase = createAdminClient()
  const code = await generateUniqueSellerCode(supabase)
  const { error } = await supabase
    .from("users")
    .update({ user_code: code })
    .eq("id", user.id)

  if (error) {
    console.error("Failed to generate seller code:", error)
    return null
  }
  return code
}

/**
 * Get the current seller's main category from the seller_categories table.
 */
export async function getSellerMainCategory(): Promise<string | null> {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return null

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("seller_categories")
    .select("main_category")
    .eq("seller_id", user.id)
    .maybeSingle()

  return data?.main_category ?? null
}

/** Create a signed upload URL for direct browser-to-storage seller logo upload. */
export async function createSellerLogoSignedUploadUrl(
  ext: string
): Promise<{ signedUrl?: string; token?: string; path?: string; filePath?: string; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "seller") return { error: "Not authorized" }

    const safeExt = (ext.match(/^[a-zA-Z0-9]+$/) ? ext : "png").toLowerCase()

    const supabase = createAdminClient()
    const filePath = `sellers/${user.id}.${safeExt}`

    // Remove any existing logo files for this seller (different extensions)
    const { data: existingFiles } = await supabase.storage.from("site-assets").list("sellers")
    if (existingFiles) {
      const toRemove = existingFiles
        .filter((f) => f.name.startsWith(`${user.id}.`))
        .map((f) => `sellers/${f.name}`)
      if (toRemove.length > 0) {
        await supabase.storage.from("site-assets").remove(toRemove)
      }
    }

    const { data, error } = await supabase.storage
      .from("site-assets")
      .createSignedUploadUrl(filePath)

    if (error) return { error: error.message }
    return { signedUrl: data.signedUrl, token: data.token, path: data.path, filePath }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create upload URL" }
  }
}

/** Finalize a seller logo upload by saving the public URL to the database. */
export async function finalizeSellerLogoUpload(
  filePath: string
): Promise<{ success?: boolean; url?: string; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "seller") return { error: "Not authorized" }

    const supabase = createAdminClient()
    const { data: urlData } = supabase.storage
      .from("site-assets")
      .getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from("users")
      .update({ logo_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq("id", user.id)

    if (updateError) return { error: updateError.message }
    return { success: true, url: urlData.publicUrl }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save logo URL" }
  }
}

/** Delete the current seller's logo from storage and clear logo_url in the database. */
export async function deleteSellerLogo(): Promise<{ success?: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "seller") return { error: "Not authorized" }

    const supabase = createAdminClient()

    // Remove any existing logo files for this seller
    const { data: existingFiles } = await supabase.storage.from("site-assets").list("sellers")
    if (existingFiles) {
      const toRemove = existingFiles
        .filter((f) => f.name.startsWith(`${user.id}.`))
        .map((f) => `sellers/${f.name}`)
      if (toRemove.length > 0) {
        await supabase.storage.from("site-assets").remove(toRemove)
      }
    }

    // Clear logo_url in the database
    const { error: updateError } = await supabase
      .from("users")
      .update({ logo_url: null, updated_at: new Date().toISOString() })
      .eq("id", user.id)

    if (updateError) return { error: updateError.message }
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete logo" }
  }
}

/**
 * Update the current seller's main category in the seller_categories table.
 * Pass null to clear the selection.
 */
export async function updateSellerMainCategory(mainCategory: string | null) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") return { error: "Not authorized" }

  const supabase = createAdminClient()

  if (!mainCategory) {
    const { error } = await supabase
      .from("seller_categories")
      .delete()
      .eq("seller_id", user.id)
    if (error) return { error: error.message }
    return { success: true }
  }

  const { error } = await supabase
    .from("seller_categories")
    .upsert(
      {
        seller_id: user.id,
        main_category: mainCategory,
        subcategories: [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "seller_id" }
    )

  if (error) return { error: error.message }
  return { success: true }
}
