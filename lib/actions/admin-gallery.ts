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

/** Sanitise a user-supplied file name so it is safe for storage paths. */
function sanitizeFileName(name: string): string {
  return name
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/[^a-zA-Z0-9._-]/g, "") // strip anything unsafe
    .replace(/-{2,}/g, "-")           // collapse consecutive hyphens
    .replace(/^[.-]+/, "")            // strip leading dots/hyphens (prevent path traversal)
    .toLowerCase()
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

  // Convert File to ArrayBuffer → Uint8Array to avoid File-shim serialization
  // issues in Next.js server actions that can cause empty/corrupt uploads.
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { data, error: uploadErr } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: true })
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

  // Normalise: collapse consecutive slashes and strip trailing slashes
  const normPath = folderPath.replace(/\/{2,}/g, "/").replace(/\/+$/, "")

  console.log("[listFolderImages] fetch path:", normPath, "| bucket:", GALLERY_BUCKET)

  const { data, error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .list(normPath, { limit: 500, sortBy: { column: "name", order: "asc" } })
  if (error) {
    console.error("[listFolderImages] Storage list error for path:", normPath, error.message)
    return { images: [], error: error.message }
  }
  if (!data || data.length === 0) {
    console.warn("[listFolderImages] No items returned for path:", normPath)
    return { images: [] }
  }

  const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"])
  const images: AdminGalleryImage[] = []
  for (const item of data) {
    // Skip the folder placeholder
    if (item.name === ".keep") continue
    // Skip sub-directory entries (they have no id); do NOT rely on metadata
    // being null — uploaded files may temporarily have null metadata
    if (!item.id) continue
    const ext = item.name.split(".").pop()?.toLowerCase() ?? ""
    if (!IMAGE_EXTENSIONS.has(ext)) continue

    const storagePath = `${normPath}/${item.name}`
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
  const safeName = sanitizeFileName(file.name)
  if (!safeName) return { error: "Invalid file name" }

  // Normalise folder path the same way listFolderImages does so upload
  // and fetch always target the exact same storage prefix.
  const normPath = folderPath.replace(/\/{2,}/g, "/").replace(/\/+$/, "")
  const storagePath = `${normPath}/${Date.now()}-${safeName}`

  console.log("[uploadImageToFolder] upload path:", storagePath, "| bucket:", GALLERY_BUCKET)

  // Convert File to ArrayBuffer → Uint8Array to avoid File-shim serialization
  // issues in Next.js server actions that can cause empty/corrupt uploads.
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { data, error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(storagePath, buffer, { contentType: file.type })
  if (error || !data) {
    console.error("[uploadImageToFolder] Upload failed for path:", storagePath, error?.message)
    return { error: error?.message ?? "Upload failed" }
  }

  const { data: urlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(storagePath)
  return {
    image: {
      name: storagePath.split("/").pop() ?? safeName,
      fullPath: storagePath,
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
  const safeName = sanitizeFileName(newName.trim())
  if (!safeName) return { error: "Invalid file name" }

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
  const newFileName = `${Date.now()}-${safeName}`
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

type CatLevel = "category" | "subcategory" | "subSubcategory"

interface CatEntry {
  id: string
  name: string
  level: CatLevel
  code: string // e.g. "01", "0101", "010101"
}

/**
 * Build a lookup structure for all categories, computing their numeric codes.
 * Main: 01-99, Sub: 0101, Sub-sub: 010101.
 */
function buildCategoryLookup(categories: SiteCategory[]): {
  entries: CatEntry[]
  byNormName: Map<string, CatEntry>
  byCode: Map<string, CatEntry>
} {
  const parentMap = new Map<string, string | null>()
  for (const cat of categories) parentMap.set(cat.id, cat.parent_id)

  function getLevel(cat: { id: string; parent_id: string | null }): CatLevel {
    if (!cat.parent_id) return "category"
    const grandParentId = parentMap.get(cat.parent_id)
    if (grandParentId != null) return "subSubcategory"
    return "subcategory"
  }

  // Group by parent for sibling index calculation
  const childrenOf = new Map<string | "root", SiteCategory[]>()
  for (const cat of categories) {
    const key = cat.parent_id ?? "root"
    const arr = childrenOf.get(key) ?? []
    arr.push(cat)
    childrenOf.set(key, arr)
  }

  // Compute code for each category
  const codeMap = new Map<string, string>()

  // Main categories (sorted by sort_order already from DB)
  const mains = childrenOf.get("root") ?? []
  mains.forEach((cat, idx) => {
    codeMap.set(cat.id, String(idx + 1).padStart(2, '0'))
  })

  // Subcategories
  for (const main of mains) {
    const subs = childrenOf.get(main.id) ?? []
    subs.forEach((sub, idx) => {
      codeMap.set(sub.id, `${codeMap.get(main.id)}${String(idx + 1).padStart(2, '0')}`)
    })

    // Sub-subcategories
    for (const sub of subs) {
      const subSubs = childrenOf.get(sub.id) ?? []
      subSubs.forEach((subSub, idx) => {
        codeMap.set(subSub.id, `${codeMap.get(sub.id)}${String(idx + 1).padStart(2, '0')}`)
      })
    }
  }

  const entries: CatEntry[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    level: getLevel(cat),
    code: codeMap.get(cat.id) ?? "00",
  }))

  const byNormName = new Map<string, CatEntry>()
  const byCode = new Map<string, CatEntry>()
  for (const e of entries) {
    byNormName.set(normalize(e.name), e)
    byCode.set(e.code, e)
  }

  return { entries, byNormName, byCode }
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

  // Get all categories (ordered by sort_order so sibling indices are stable)
  const { data: categories } = await supabase
    .from("site_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  if (!categories) return { ...empty, error: "Could not load categories" }

  const lookup = buildCategoryLookup(categories as SiteCategory[])

  // Determine folder code from the folder name for scoped matching
  // e.g. folder_path "admin-gallery/01" → folderCode "01"
  const folderName = folderPath.split("/").pop() ?? ""
  const folderCode = /^\d+$/.test(folderName) ? folderName : null

  // Filter categories to match scope based on folder code
  let scopedEntries = lookup.entries
  if (folderCode) {
    scopedEntries = lookup.entries.filter((e) => e.code.startsWith(folderCode))
  }

  // Build scoped lookup maps
  const scopedByNormName = new Map<string, CatEntry>()
  const scopedByCode = new Map<string, CatEntry>()
  for (const e of scopedEntries) {
    scopedByNormName.set(normalize(e.name), e)
    scopedByCode.set(e.code, e)
  }

  let matched = 0
  let unmatched = 0
  let matchedCategories = 0
  let matchedSubcategories = 0
  let matchedSubSubcategories = 0

  for (const img of images) {
    const normName = normalize(img.name)
    // Try matching by numeric code first, then by normalized name
    const cat = scopedByCode.get(normName) ?? scopedByNormName.get(normName)
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

/* ── Single-image auto-match ─────────────────────────────────────── */

export interface SingleMatchResult {
  found: boolean
  categoryId?: string
  categoryName?: string
  error?: string
}

/**
 * Attempt to match a single image filename against all category numeric codes
 * and names (main, sub, sub-sub). Does NOT update the DB — the caller should
 * confirm and then call linkImageToCategory.
 */
export async function autoMatchSingleImage(
  imageName: string
): Promise<SingleMatchResult> {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: categories } = await supabase
    .from("site_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  if (!categories) return { found: false, error: "Could not load categories" }

  const lookup = buildCategoryLookup(categories as SiteCategory[])
  const normName = normalize(imageName)

  // Try matching by numeric code first, then by normalized name
  const cat = lookup.byCode.get(normName) ?? lookup.byNormName.get(normName)
  if (cat) {
    return { found: true, categoryId: cat.id, categoryName: cat.name }
  }

  return { found: false }
}
