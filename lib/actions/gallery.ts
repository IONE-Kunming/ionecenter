"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/actions/users"

const GALLERY_BUCKET = "product-images"

export interface GalleryItem {
  name: string
  fullPath: string
  publicUrl: string
  type: "image" | "video"
  size: number
  createdAt: string | null
}

export interface GalleryFolder {
  name: string
  fullPath: string
}

/**
 * List folders and files in the seller's gallery at the given path prefix.
 */
export async function listGallery(
  folderPath: string = ""
): Promise<{ folders: GalleryFolder[]; files: GalleryItem[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { folders: [], files: [], error: "Not authenticated" }

  const supabase = createAdminClient()
  const prefix = folderPath ? `gallery/${user.id}/${folderPath}` : `gallery/${user.id}`

  const { data, error } = await supabase.storage.from(GALLERY_BUCKET).list(prefix, {
    limit: 200,
    offset: 0,
    sortBy: { column: "name", order: "asc" },
  })

  if (error) return { folders: [], files: [], error: error.message }

  const folders: GalleryFolder[] = []
  const files: GalleryItem[] = []

  for (const item of data ?? []) {
    if (item.metadata === null) {
      // It's a folder (prefix)
      const folderFullPath = folderPath ? `${folderPath}/${item.name}` : item.name
      folders.push({ name: item.name, fullPath: folderFullPath })
    } else {
      const storagePath = `${prefix}/${item.name}`
      const { data: urlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(storagePath)
      const ext = item.name.split(".").pop()?.toLowerCase() ?? ""
      const isVideo = ["mp4", "mov", "avi", "webm", "mkv"].includes(ext)
      const itemFullPath = folderPath ? `${folderPath}/${item.name}` : item.name
      files.push({
        name: item.name,
        fullPath: itemFullPath,
        publicUrl: urlData.publicUrl,
        type: isVideo ? "video" : "image",
        size: item.metadata?.size ?? 0,
        createdAt: item.created_at ?? null,
      })
    }
  }

  return { folders, files }
}

/**
 * Create a signed upload URL for direct browser-to-storage gallery upload.
 */
export async function createGallerySignedUploadUrl(
  ext: string,
  folderPath: string,
  fileName: string
): Promise<{ signedUrl?: string; token?: string; path?: string; storagePath?: string; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const supabase = createAdminClient()
  const storagePath = folderPath
    ? `gallery/${user.id}/${folderPath}/${Date.now()}-${fileName}`
    : `gallery/${user.id}/${Date.now()}-${fileName}`

  const { data, error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .createSignedUploadUrl(storagePath)

  if (error) return { error: error.message }
  return { signedUrl: data.signedUrl, token: data.token, path: data.path, storagePath }
}

/**
 * Finalize a gallery file upload: return a GalleryItem from the uploaded storage path.
 */
export async function finalizeGalleryUpload(
  storagePath: string,
  fileSize: number,
  _folderPath: string
): Promise<{ item?: GalleryItem; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const supabase = createAdminClient()
  const { data: urlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(storagePath)

  const storedFileName = storagePath.split("/").pop() ?? ""
  const ext = storedFileName.split(".").pop()?.toLowerCase() ?? ""
  const isVid = ["mp4", "mov", "avi", "webm", "mkv"].includes(ext)
  const userPrefix = `gallery/${user.id}/`
  const itemFullPath = storagePath.startsWith(userPrefix)
    ? storagePath.slice(userPrefix.length)
    : storagePath

  return {
    item: {
      name: storedFileName,
      fullPath: itemFullPath,
      publicUrl: urlData.publicUrl,
      type: isVid ? "video" : "image",
      size: fileSize,
      createdAt: new Date().toISOString(),
    },
  }
}

/**
 * Upload a file to the seller's gallery.
 */
export async function uploadGalleryFile(
  formData: FormData
): Promise<{ item?: GalleryItem; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const file = formData.get("file") as File
  const folderPath = (formData.get("folderPath") as string) || ""

  if (!file) return { error: "No file provided" }

  const isImage = file.type.startsWith("image/")
  const isVideo = file.type.startsWith("video/")
  if (!isImage && !isVideo) return { error: "Only images and videos are allowed" }

  const supabase = createAdminClient()
  const storagePath = folderPath
    ? `gallery/${user.id}/${folderPath}/${Date.now()}-${file.name}`
    : `gallery/${user.id}/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(storagePath, file, { contentType: file.type })

  if (error) return { error: error.message }

  const { data: urlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(data.path)

  // Extract the actual stored filename from the path (includes timestamp prefix)
  const storedFileName = data.path.split("/").pop() ?? file.name
  const ext = storedFileName.split(".").pop()?.toLowerCase() ?? ""
  const isVid = ["mp4", "mov", "avi", "webm", "mkv"].includes(ext)
  // fullPath relative to the user's gallery root (strip "gallery/{userId}/" prefix)
  const userPrefix = `gallery/${user.id}/`
  const itemFullPath = data.path.startsWith(userPrefix)
    ? data.path.slice(userPrefix.length)
    : data.path

  return {
    item: {
      name: storedFileName,
      fullPath: itemFullPath,
      publicUrl: urlData.publicUrl,
      type: isVid ? "video" : "image",
      size: file.size,
      createdAt: new Date().toISOString(),
    },
  }
}

/**
 * Create a new folder in the seller's gallery by uploading a placeholder .keep file.
 */
export async function createGalleryFolder(
  folderName: string,
  parentPath: string = ""
): Promise<{ folder?: GalleryFolder; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const cleanName = folderName.replace(/[^a-zA-Z0-9_\- ]/g, "").trim()
  if (!cleanName) return { error: "Invalid folder name" }

  const supabase = createAdminClient()
  const storagePath = parentPath
    ? `gallery/${user.id}/${parentPath}/${cleanName}/.keep`
    : `gallery/${user.id}/${cleanName}/.keep`

  const keepFile = new Blob([""], { type: "text/plain" })
  const { error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(storagePath, keepFile, { contentType: "text/plain" })

  if (error && !error.message.includes("already exists")) return { error: error.message }

  const fullPath = parentPath ? `${parentPath}/${cleanName}` : cleanName
  return { folder: { name: cleanName, fullPath } }
}

/**
 * Delete a file from the seller's gallery.
 */
export async function deleteGalleryFile(
  filePath: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const supabase = createAdminClient()
  const storagePath = `gallery/${user.id}/${filePath}`

  const { error } = await supabase.storage.from(GALLERY_BUCKET).remove([storagePath])

  if (error) return { error: error.message }
  return {}
}

/**
 * Delete a folder and all its contents from the seller's gallery.
 * Note: This handles up to 2 levels of nesting (folder → sub-folder → files).
 * Folders with more than 1000 files will only have the first 1000 deleted.
 */
export async function deleteGalleryFolder(
  folderPath: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const supabase = createAdminClient()
  const prefix = `gallery/${user.id}/${folderPath}`

  // Recursively collect all storage paths under `prefix`
  async function collectPaths(storagePrefix: string, depth = 0): Promise<string[]> {
    if (depth > 5) return [] // guard against unexpectedly deep nesting

    const { data, error: listError } = await supabase.storage
      .from(GALLERY_BUCKET)
      .list(storagePrefix, { limit: 1000, offset: 0 })

    if (listError) return []

    const paths: string[] = []
    for (const item of data ?? []) {
      const itemPath = `${storagePrefix}/${item.name}`
      if (item.metadata === null) {
        // null metadata indicates a folder placeholder (Supabase Storage pseudo-directory)
        const subPaths = await collectPaths(itemPath, depth + 1)
        paths.push(...subPaths)
        // Also add the .keep file that marks this sub-folder
        paths.push(`${itemPath}/.keep`)
      } else {
        paths.push(itemPath)
      }
    }
    return paths
  }

  const paths = await collectPaths(prefix)
  // Include the .keep file for the top-level folder itself
  paths.push(`${prefix}/.keep`)

  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(GALLERY_BUCKET)
      .remove(paths)
    if (removeError) return { error: removeError.message }
  }

  return {}
}
