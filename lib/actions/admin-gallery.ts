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

/* ── Rename image ─────────────────────────────────────────────────── */

export async function renameAdminGalleryImage(
  fullPath: string,
  newName: string
): Promise<{ image?: AdminGalleryImage; error?: string }> {
  await requireAdmin()
  const cleanName = newName.trim()
  if (!cleanName) return { error: "Invalid file name" }

  const supabase = createAdminClient()

  // Download the old file
  const { data: fileData, error: downloadErr } = await supabase.storage
    .from(GALLERY_BUCKET)
    .download(fullPath)
  if (downloadErr || !fileData) return { error: downloadErr?.message ?? "Failed to download file" }

  // Build new storage path: same folder, new timestamp-name
  const pathParts = fullPath.split("/")
  pathParts.pop() // remove old filename
  const folderPath = pathParts.join("/")
  const newFileName = `${Date.now()}-${cleanName}`
  const newStoragePath = `${folderPath}/${newFileName}`

  // Upload with new name
  const { error: uploadErr } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(newStoragePath, fileData, { contentType: fileData.type || "application/octet-stream" })
  if (uploadErr) return { error: uploadErr.message }

  // Delete old file
  await supabase.storage.from(GALLERY_BUCKET).remove([fullPath])

  // Build return item
  const { data: urlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(newStoragePath)

  return {
    image: {
      name: newFileName,
      fullPath: newStoragePath,
      publicUrl: urlData.publicUrl,
      size: fileData.size,
      createdAt: new Date().toISOString(),
    },
  }
}

/* ── Auto-match ──────────────────────────────────────────────────── */

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\.[^.]+$/, "") // strip file extension
    .replace(/^\d+-/, "")     // strip leading timestamp prefix (e.g. 1234567890-)
    .replace(/[-_ ]+/g, "")  // collapse dashes, underscores, spaces
    .trim()
}

export interface AutoMatchResult {
  matched: number
  unmatched: number
  matchedCategories: number
  matchedSubcategories: number
  matchedSubSubcategories: number
  error?: string
}

export async function autoMatchFolderImages(
  folderPath: string
): Promise<AutoMatchResult> {
  await requireAdmin()
  const supabase = createAdminClient()

  const empty: AutoMatchResult = {
    matched: 0,
    unmatched: 0,
    matchedCategories: 0,
    matchedSubcategories: 0,
    matchedSubSubcategories: 0,
  }

  // Get all images in folder
  const { images, error: listErr } = await listFolderImages(folderPath)
  if (listErr) return { ...empty, error: listErr }

  // Get all categories
  const { data: categories } = await supabase
    .from("site_categories")
    .select("*")
    .order("name")
  if (!categories) return { ...empty, error: "Could not load categories" }

  // Classify each category: main / subcategory / sub-subcategory
  // Sub-subcategory = parent_id is set AND that parent also has a parent_id
  const parentMap = new Map<string, string | null>()
  for (const cat of categories) {
    parentMap.set(cat.id, cat.parent_id)
  }

  type CatLevel = "category" | "subcategory" | "subSubcategory"
  function getLevel(cat: { id: string; parent_id: string | null }): CatLevel {
    if (!cat.parent_id) return "category"
    const grandParentId = parentMap.get(cat.parent_id)
    if (grandParentId != null) return "subSubcategory"
    return "subcategory"
  }

  // Build lookup: normalised name → { id, name, level }
  const catMap = new Map<string, { id: string; name: string; level: CatLevel }>()
  for (const cat of categories) {
    catMap.set(normalize(cat.name), { id: cat.id, name: cat.name, level: getLevel(cat) })
  }

  let matched = 0
  let unmatched = 0
  let matchedCategories = 0
  let matchedSubcategories = 0
  let matchedSubSubcategories = 0

  for (const img of images) {
    const normName = normalize(img.name)
    const cat = catMap.get(normName)
    if (cat) {
      await supabase
        .from("site_categories")
        .update({ image_url: img.publicUrl, updated_at: new Date().toISOString() })
        .eq("id", cat.id)
      matched++
      if (cat.level === "category") matchedCategories++
      else if (cat.level === "subcategory") matchedSubcategories++
      else matchedSubSubcategories++
    } else {
      unmatched++
    }
  }

  return { matched, unmatched, matchedCategories, matchedSubcategories, matchedSubSubcategories }
}
