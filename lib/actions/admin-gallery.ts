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

  // Normalise: strip any accidental trailing slashes
  const normPath = folderPath.replace(/\/+$/, "")

  const { data, error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .list(normPath, { limit: 500, sortBy: { column: "name", order: "asc" } })
  if (error) return { images: [], error: error.message }

  const images: AdminGalleryImage[] = []
  for (const item of data ?? []) {
    if (item.name === ".keep" || item.metadata === null) continue
    const ext = item.name.split(".").pop()?.toLowerCase() ?? ""
    if (!["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"].includes(ext)) continue

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
  const storagePath = `${folderPath}/${Date.now()}-${safeName}`

  const { data, error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(storagePath, file, { contentType: file.type })
  if (error || !data) return { error: error?.message ?? "Upload failed" }

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

export interface AutoMatchResult {
  matched: number
  unmatched: number
  matchedCategories: number
  matchedSubcategories: number
  matchedSubSubcategories: number
  error?: string
}

/**
 * Compute the numeric code for each category based on sort_order position.
 * Main: 01-99, Sub: 0101, Sub-sub: 010101
 */
function buildCategoryCodeMap(
  categories: { id: string; parent_id: string | null; sort_order: number; name: string }[]
): { codeMap: Map<string, string>; idToCode: Map<string, string> } {
  const parentMap = new Map<string, string | null>()
  for (const cat of categories) parentMap.set(cat.id, cat.parent_id)

  // Group children by parent_id, sorted by sort_order then name
  const childrenOf = new Map<string | null, typeof categories>()
  for (const cat of categories) {
    const pid = cat.parent_id ?? null
    if (!childrenOf.has(pid)) childrenOf.set(pid, [])
    childrenOf.get(pid)!.push(cat)
  }
  for (const children of childrenOf.values()) {
    children.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
  }

  const idToCode = new Map<string, string>()
  const codeMap = new Map<string, string>() // code → id

  // Main categories (level 0)
  const mains = childrenOf.get(null) ?? []
  for (let i = 0; i < mains.length; i++) {
    const code = String(i + 1).padStart(2, '0')
    idToCode.set(mains[i].id, code)
    codeMap.set(code, mains[i].id)

    // Subcategories (level 1)
    const subs = childrenOf.get(mains[i].id) ?? []
    for (let j = 0; j < subs.length; j++) {
      const subCode = `${code}${String(j + 1).padStart(2, '0')}`
      idToCode.set(subs[j].id, subCode)
      codeMap.set(subCode, subs[j].id)

      // Sub-subcategories (level 2)
      const subSubs = childrenOf.get(subs[j].id) ?? []
      for (let k = 0; k < subSubs.length; k++) {
        const subSubCode = `${subCode}${String(k + 1).padStart(2, '0')}`
        idToCode.set(subSubs[k].id, subSubCode)
        codeMap.set(subSubCode, subSubs[k].id)
      }
    }
  }

  return { codeMap, idToCode }
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
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  if (!categories) return { ...empty, error: "Could not load categories" }

  // Classify each category level
  const parentMap = new Map<string, string | null>()
  for (const cat of categories) parentMap.set(cat.id, cat.parent_id)

  type CatLevel = "category" | "subcategory" | "subSubcategory"
  function getLevel(cat: { id: string; parent_id: string | null }): CatLevel {
    if (!cat.parent_id) return "category"
    const grandParentId = parentMap.get(cat.parent_id)
    if (grandParentId != null) return "subSubcategory"
    return "subcategory"
  }

  // Build code map and name lookup
  const { codeMap, idToCode } = buildCategoryCodeMap(categories)

  // Determine the folder name code (e.g. "01", "0101", "010101")
  const folderName = folderPath.split("/").pop() ?? ""
  const folderCode = folderName.replace(/[^0-9]/g, "")

  // Filter categories to match against based on folder code
  let targetCategoryIds: Set<string> | null = null
  if (folderCode && codeMap.has(folderCode)) {
    targetCategoryIds = new Set<string>()
    // Include the folder's own category and all descendants whose codes start with folderCode
    for (const [code, catId] of codeMap.entries()) {
      if (code.startsWith(folderCode)) {
        targetCategoryIds.add(catId)
      }
    }
  }

  // Build lookup maps: normalised name → { id, level } and code → { id, level }
  const nameMap = new Map<string, { id: string; level: CatLevel }>()
  const codeToInfo = new Map<string, { id: string; level: CatLevel }>()
  for (const cat of categories) {
    const level = getLevel(cat)
    // Skip if folder code filtering is active and category is not in target set
    if (targetCategoryIds && !targetCategoryIds.has(cat.id)) continue
    nameMap.set(normalize(cat.name), { id: cat.id, level })
    const code = idToCode.get(cat.id)
    if (code) codeToInfo.set(code, { id: cat.id, level })
  }

  let matched = 0
  let unmatched = 0
  let matchedCategories = 0
  let matchedSubcategories = 0
  let matchedSubSubcategories = 0

  for (const img of images) {
    const normName = normalize(img.name)
    // Try matching by name first, then by numeric code
    const match = nameMap.get(normName) ?? codeToInfo.get(normName)
    if (match) {
      await supabase
        .from("site_categories")
        .update({ image_url: img.publicUrl, updated_at: new Date().toISOString() })
        .eq("id", match.id)
      matched++
      if (match.level === "category") matchedCategories++
      else if (match.level === "subcategory") matchedSubcategories++
      else matchedSubSubcategories++
    } else {
      unmatched++
    }
  }

  return { matched, unmatched, matchedCategories, matchedSubcategories, matchedSubSubcategories }
}

/**
 * Match a single image filename against all categories by numeric code or name.
 * Returns the matched category info or null if no match.
 */
export async function matchSingleImage(
  imageName: string
): Promise<{ categoryId: string; categoryName: string; level: string } | null> {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: categories } = await supabase
    .from("site_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  if (!categories) return null

  const parentMap = new Map<string, string | null>()
  for (const cat of categories) parentMap.set(cat.id, cat.parent_id)

  function getLevel(cat: { id: string; parent_id: string | null }): string {
    if (!cat.parent_id) return "category"
    const grandParentId = parentMap.get(cat.parent_id)
    if (grandParentId != null) return "subSubcategory"
    return "subcategory"
  }

  const { idToCode } = buildCategoryCodeMap(categories)
  const normName = normalize(imageName)

  // Try matching by normalized name or numeric code in a single pass
  let codeMatch: { categoryId: string; categoryName: string; level: string } | null = null
  for (const cat of categories) {
    if (normalize(cat.name) === normName) {
      return { categoryId: cat.id, categoryName: cat.name, level: getLevel(cat) }
    }
    if (!codeMatch) {
      const code = idToCode.get(cat.id)
      if (code && code === normName) {
        codeMatch = { categoryId: cat.id, categoryName: cat.name, level: getLevel(cat) }
      }
    }
  }

  return codeMatch
}
