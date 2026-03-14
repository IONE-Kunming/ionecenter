"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/actions/users"
import type { SiteCategory } from "@/lib/actions/site-settings"

const GALLERY_BUCKET = "site-assets"

/* ── Types ───────────────────────────────────────────────────────── */

export interface AdminGalleryFolder {
  id: string
  folder_name: string
  folder_path: string
  cover_image: string | null
  created_at: string
  updated_at: string
}

export interface AdminGalleryImage {
  name: string
  fullPath: string
  publicUrl: string
  size: number
  createdAt: string | null
}

/* ── Helpers ─────────────────────────────────────────────────────── */

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") throw new Error("Not authorized")
  return user
}

/* ── Folder CRUD ─────────────────────────────────────────────────── */

export async function listAdminGalleryFolders(): Promise<AdminGalleryFolder[]> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("admin_gallery_folders")
    .select("*")
    .order("created_at", { ascending: false })
  return (data ?? []) as AdminGalleryFolder[]
}

export async function createAdminGalleryFolder(
  folderName: string
): Promise<{ folder?: AdminGalleryFolder; error?: string }> {
  await requireAdmin()
  const cleanName = folderName.replace(/[^a-zA-Z0-9_\- ]/g, "").trim()
  if (!cleanName) return { error: "Invalid folder name" }

  const supabase = createAdminClient()
  const folderPath = `admin-gallery/${cleanName}`

  // Create a .keep file so the storage folder exists
  const keepFile = new Blob([""], { type: "text/plain" })
  const { error: storageErr } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(`${folderPath}/.keep`, keepFile, { contentType: "text/plain" })
  if (storageErr && !storageErr.message.includes("already exists"))
    return { error: storageErr.message }

  const { data, error } = await supabase
    .from("admin_gallery_folders")
    .insert({
      folder_name: cleanName,
      folder_path: folderPath,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { folder: data as AdminGalleryFolder }
}

export async function deleteAdminGalleryFolder(
  folderId: string
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()

  // Get folder info
  const { data: folder } = await supabase
    .from("admin_gallery_folders")
    .select("*")
    .eq("id", folderId)
    .single()
  if (!folder) return { error: "Folder not found" }

  // Remove all files in storage
  const { data: storageFiles } = await supabase.storage
    .from(GALLERY_BUCKET)
    .list(folder.folder_path, { limit: 500 })
  if (storageFiles && storageFiles.length > 0) {
    const paths = storageFiles.map((f: { name: string }) => `${folder.folder_path}/${f.name}`)
    await supabase.storage.from(GALLERY_BUCKET).remove(paths)
  }

  // Delete DB row
  const { error } = await supabase
    .from("admin_gallery_folders")
    .delete()
    .eq("id", folderId)
  if (error) return { error: error.message }
  return {}
}

/* ── Cover Image ─────────────────────────────────────────────────── */

export async function updateAdminFolderCover(
  folderId: string,
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  await requireAdmin()
  const file = formData.get("file") as File
  if (!file) return { error: "No file provided" }
  if (!file.type.startsWith("image/")) return { error: "Only images are allowed" }

  const supabase = createAdminClient()
  const storagePath = `admin-gallery/_covers/${folderId}-${Date.now()}.${file.name.split(".").pop() || "png"}`

  const { data, error: uploadErr } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: true })
  if (uploadErr || !data) return { error: uploadErr?.message ?? "Upload failed" }

  const { data: urlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(data.path)

  const { error: dbErr } = await supabase
    .from("admin_gallery_folders")
    .update({ cover_image: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", folderId)
  if (dbErr) return { error: dbErr.message }

  return { url: urlData.publicUrl }
}

/* ── Images inside folders ───────────────────────────────────────── */

export async function listFolderImages(
  folderPath: string
): Promise<{ images: AdminGalleryImage[]; error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data, error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .list(folderPath, { limit: 500, sortBy: { column: "name", order: "asc" } })
  if (error) return { images: [], error: error.message }

  const images: AdminGalleryImage[] = []
  for (const item of data ?? []) {
    if (item.name === ".keep" || item.metadata === null) continue
    const ext = item.name.split(".").pop()?.toLowerCase() ?? ""
    if (!["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"].includes(ext)) continue

    const storagePath = `${folderPath}/${item.name}`
    const { data: urlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(storagePath)
    images.push({
      name: item.name,
      fullPath: storagePath,
      publicUrl: urlData.publicUrl,
      size: item.metadata?.size ?? 0,
      createdAt: item.created_at ?? null,
    })
  }
  return { images }
}

export async function uploadImageToFolder(
  folderPath: string,
  formData: FormData
): Promise<{ image?: AdminGalleryImage; error?: string }> {
  await requireAdmin()
  const file = formData.get("file") as File
  if (!file) return { error: "No file provided" }
  if (!file.type.startsWith("image/")) return { error: "Only images are allowed" }

  const supabase = createAdminClient()
  const storagePath = `${folderPath}/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(storagePath, file, { contentType: file.type })
  if (error || !data) return { error: error?.message ?? "Upload failed" }

  const { data: urlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(data.path)
  return {
    image: {
      name: data.path.split("/").pop() ?? file.name,
      fullPath: data.path,
      publicUrl: urlData.publicUrl,
      size: file.size,
      createdAt: new Date().toISOString(),
    },
  }
}

export async function deleteImageFromFolder(
  fullPath: string
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.storage.from(GALLERY_BUCKET).remove([fullPath])
  if (error) return { error: error.message }
  return {}
}

/* ── Categories ──────────────────────────────────────────────────── */

export async function getAllSiteCategories(): Promise<SiteCategory[]> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("site_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  return (data ?? []) as SiteCategory[]
}

/* ── Link folder to category / subcategory ───────────────────────── */

export async function linkImageToCategory(
  imageUrl: string,
  categoryId: string
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("site_categories")
    .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
    .eq("id", categoryId)
  if (error) return { error: error.message }
  return {}
}

/* ── Auto-match ──────────────────────────────────────────────────── */

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/\.[^.]+$/, "") // strip file extension
    .replace(/^\d+-/, "")     // strip leading timestamp prefix (e.g. 1234567890-)
    .replace(/[-_ ]+/g, "")  // collapse dashes, underscores, spaces
    .trim()
}

export async function autoMatchFolderImages(
  folderPath: string
): Promise<{ matched: number; unmatched: number; error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()

  // Get all images in folder
  const { images, error: listErr } = await listFolderImages(folderPath)
  if (listErr) return { matched: 0, unmatched: 0, error: listErr }

  // Get all categories
  const { data: categories } = await supabase
    .from("site_categories")
    .select("*")
    .order("name")
  if (!categories) return { matched: 0, unmatched: 0, error: "Could not load categories" }

  // Build lookup: normalised name → category
  const catMap = new Map<string, { id: string; name: string }>()
  for (const cat of categories) {
    catMap.set(normalise(cat.name), { id: cat.id, name: cat.name })
  }

  let matched = 0
  let unmatched = 0

  for (const img of images) {
    const normName = normalise(img.name)
    const cat = catMap.get(normName)
    if (cat) {
      await supabase
        .from("site_categories")
        .update({ image_url: img.publicUrl, updated_at: new Date().toISOString() })
        .eq("id", cat.id)
      matched++
    } else {
      unmatched++
    }
  }

  return { matched, unmatched }
}
