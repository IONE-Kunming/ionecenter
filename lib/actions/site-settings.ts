"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./users"

// ─── Site Settings ──────────────────────────────────────────────────────────

export async function getSiteSetting(key: string): Promise<string> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle()
  return data?.value ?? ""
}

export async function updateSiteSetting(key: string, value: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() })
  if (error) return { error: error.message }
  return { success: true }
}

// ─── Video Management ───────────────────────────────────────────────────────

export async function uploadSiteVideo(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const file = formData.get("file") as File | null
  if (!file) return { error: "No file provided" }

  const supabase = createAdminClient()
  const ext = file.name.split(".").pop() || "mp4"
  const filePath = `videos/homepage-video.${ext}`

  // Remove existing video if any
  await supabase.storage.from("site-assets").remove([filePath])

  const { error: uploadError } = await supabase.storage
    .from("site-assets")
    .upload(filePath, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = supabase.storage
    .from("site-assets")
    .getPublicUrl(filePath)

  // Save the URL in site settings
  await supabase
    .from("site_settings")
    .upsert({ key: "homepage_video_url", value: urlData.publicUrl, updated_at: new Date().toISOString() })

  return { success: true, url: urlData.publicUrl }
}

export async function removeSiteVideo() {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()

  // List and remove all files in videos/ folder
  const { data: files } = await supabase.storage.from("site-assets").list("videos")
  if (files && files.length > 0) {
    const paths = files.map((f) => `videos/${f.name}`)
    await supabase.storage.from("site-assets").remove(paths)
  }

  // Clear the setting
  await supabase
    .from("site_settings")
    .upsert({ key: "homepage_video_url", value: "", updated_at: new Date().toISOString() })

  return { success: true }
}

// ─── Category Management ────────────────────────────────────────────────────

export interface SiteCategory {
  id: string
  name: string
  parent_id: string | null
  image_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export async function getSiteCategories(): Promise<SiteCategory[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("site_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  return (data ?? []) as SiteCategory[]
}

export async function createSiteCategory(
  name: string,
  parentId: string | null,
  sortOrder: number
) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("site_categories")
    .insert({ name, parent_id: parentId, sort_order: sortOrder })
    .select()
    .single()

  if (error) return { error: error.message }
  return { success: true, category: data as SiteCategory }
}

export async function updateSiteCategory(
  id: string,
  updates: { name?: string; parent_id?: string | null; sort_order?: number; image_url?: string | null }
) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("site_categories")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteSiteCategory(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("site_categories")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function reorderSiteCategories(
  items: { id: string; sort_order: number }[]
) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()
  for (const item of items) {
    const { error } = await supabase
      .from("site_categories")
      .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
      .eq("id", item.id)
    if (error) return { error: error.message }
  }
  return { success: true }
}

export async function uploadCategoryImage(categoryId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const file = formData.get("file") as File | null
  if (!file) return { error: "No file provided" }

  const supabase = createAdminClient()
  const ext = file.name.split(".").pop() || "png"
  const filePath = `categories/${categoryId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("site-assets")
    .upload(filePath, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = supabase.storage
    .from("site-assets")
    .getPublicUrl(filePath)

  // Update the category record
  const { error: updateError } = await supabase
    .from("site_categories")
    .update({ image_url: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", categoryId)

  if (updateError) return { error: updateError.message }
  return { success: true, url: urlData.publicUrl }
}

export async function removeCategoryImage(categoryId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return { error: "Not authorized" }

  const supabase = createAdminClient()

  // List files matching category ID
  const { data: files } = await supabase.storage.from("site-assets").list("categories")
  if (files) {
    const matching = files.filter((f) => f.name.startsWith(categoryId))
    if (matching.length > 0) {
      await supabase.storage.from("site-assets").remove(matching.map((f) => `categories/${f.name}`))
    }
  }

  // Clear image_url
  const { error } = await supabase
    .from("site_categories")
    .update({ image_url: null, updated_at: new Date().toISOString() })
    .eq("id", categoryId)

  if (error) return { error: error.message }
  return { success: true }
}
