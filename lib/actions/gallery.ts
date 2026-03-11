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
  coverImage?: string | null
}

export interface GalleryFolderStats {
  imageCount: number
  linkedProductsCount: number
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

  // Collect folder paths to batch-fetch cover images
  const folderEntries: { name: string; fullPath: string }[] = []

  for (const item of data ?? []) {
    if (item.metadata === null) {
      // It's a folder (prefix)
      const folderFullPath = folderPath ? `${folderPath}/${item.name}` : item.name
      folderEntries.push({ name: item.name, fullPath: folderFullPath })
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

  // Fetch cover images for all folders from gallery_folders table
  if (folderEntries.length > 0) {
    const folderPaths = folderEntries.map((f) => f.fullPath)
    const { data: folderRecords } = await supabase
      .from("gallery_folders")
      .select("folder_path, cover_image")
      .eq("seller_id", user.id)
      .in("folder_path", folderPaths)

    const coverMap = new Map<string, string | null>()
    for (const rec of folderRecords ?? []) {
      coverMap.set(rec.folder_path, rec.cover_image)
    }

    for (const entry of folderEntries) {
      folders.push({
        name: entry.name,
        fullPath: entry.fullPath,
        coverImage: coverMap.get(entry.fullPath) ?? null,
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
 * Also saves the folder record to the gallery_folders table with optional cover image.
 */
export async function createGalleryFolder(
  folderName: string,
  parentPath: string = "",
  coverImageUrl?: string | null
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

  // Upsert into gallery_folders table
  const { error: dbError } = await supabase
    .from("gallery_folders")
    .upsert(
      {
        seller_id: user.id,
        folder_name: cleanName,
        folder_path: fullPath,
        cover_image: coverImageUrl ?? null,
      },
      { onConflict: "seller_id,folder_path" }
    )

  if (dbError) return { error: dbError.message }

  return { folder: { name: cleanName, fullPath, coverImage: coverImageUrl ?? null } }
}

/**
 * Upload a cover image for a gallery folder.
 * Returns the public URL of the uploaded cover image.
 */
export async function uploadFolderCoverImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const file = formData.get("file") as File
  if (!file) return { error: "No file provided" }
  if (!file.type.startsWith("image/")) return { error: "Only images are allowed" }

  const supabase = createAdminClient()
  const storagePath = `gallery/${user.id}/_covers/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(storagePath, file, { contentType: file.type })

  if (error) return { error: error.message }

  const { data: urlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(data.path)
  return { url: urlData.publicUrl }
}

/**
 * Update the cover image for an existing gallery folder.
 * Uploads the new cover image and updates the gallery_folders record.
 */
export async function updateFolderCoverImage(
  folderPath: string,
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const file = formData.get("file") as File
  if (!file) return { error: "No file provided" }
  if (!file.type.startsWith("image/")) return { error: "Only images are allowed" }

  const supabase = createAdminClient()
  const storagePath = `gallery/${user.id}/_covers/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(storagePath, file, { contentType: file.type })

  if (error || !data) return { error: error?.message ?? "Upload failed" }

  const { data: urlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(data.path)
  const newUrl = urlData.publicUrl

  const { error: dbError } = await supabase
    .from("gallery_folders")
    .update({ cover_image: newUrl })
    .eq("seller_id", user.id)
    .eq("folder_path", folderPath)

  if (dbError) return { error: dbError.message }

  return { url: newUrl }
}

/**
 * Delete a file from the seller's gallery.
 * Also removes matching record(s) from product_images by specific id,
 * and reassigns primary if needed.
 */
export async function deleteGalleryFile(
  filePath: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const supabase = createAdminClient()
  const storagePath = `gallery/${user.id}/${filePath}`

  // Get the public URL to match against product_images.image_url
  const { data: urlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(storagePath)
  const publicUrl = urlData.publicUrl

  // Delete the file from storage
  const { error } = await supabase.storage.from(GALLERY_BUCKET).remove([storagePath])
  if (error) return { error: error.message }

  // Find matching product_images records by image_url
  const { data: matchingImages, error: queryErr } = await supabase
    .from("product_images")
    .select("id, product_id, is_primary")
    .eq("image_url", publicUrl)

  if (!queryErr && matchingImages && matchingImages.length > 0) {
    for (const img of matchingImages) {
      // Delete this specific record by its id
      const { error: delErr } = await supabase
        .from("product_images")
        .delete()
        .eq("id", img.id)

      if (delErr) continue

      // If this was the primary image, promote the next available image
      if (img.is_primary) {
        const { data: nextImage } = await supabase
          .from("product_images")
          .select("id")
          .eq("product_id", img.product_id)
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle()

        if (nextImage) {
          await supabase
            .from("product_images")
            .update({ is_primary: true })
            .eq("id", nextImage.id)
        }
        // If no next image exists, product falls back to products.image_url
      }
    }
  }

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

  // Delete the folder record from gallery_folders table
  const { error: dbError } = await supabase
    .from("gallery_folders")
    .delete()
    .eq("seller_id", user.id)
    .eq("folder_path", folderPath)

  if (dbError) return { error: dbError.message }

  return {}
}

/**
 * Rename a gallery file by copying it to a new path and deleting the old one.
 */
export async function renameGalleryFile(
  filePath: string,
  newName: string
): Promise<{ newItem?: GalleryItem; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const cleanName = newName.trim()
  if (!cleanName) return { error: "Invalid file name" }

  const supabase = createAdminClient()
  const oldStoragePath = `gallery/${user.id}/${filePath}`

  // Download the old file
  const { data: fileData, error: downloadErr } = await supabase.storage
    .from(GALLERY_BUCKET)
    .download(oldStoragePath)

  if (downloadErr || !fileData) return { error: downloadErr?.message ?? "Failed to download file" }

  // Build new storage path: same folder, new timestamp-name
  const pathParts = filePath.split("/")
  pathParts.pop() // remove old filename
  const folderPath = pathParts.join("/")
  const ext = cleanName.split(".").pop()?.toLowerCase() ?? ""
  const newFileName = `${Date.now()}-${cleanName}`
  const newStoragePath = folderPath
    ? `gallery/${user.id}/${folderPath}/${newFileName}`
    : `gallery/${user.id}/${newFileName}`

  // Upload with new name
  const { error: uploadErr } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(newStoragePath, fileData, { contentType: fileData.type || "application/octet-stream" })

  if (uploadErr) return { error: uploadErr.message }

  // Delete old file
  await supabase.storage.from(GALLERY_BUCKET).remove([oldStoragePath])

  // Build return item
  const { data: urlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(newStoragePath)
  const isVid = ["mp4", "mov", "avi", "webm", "mkv"].includes(ext)
  const itemFullPath = folderPath ? `${folderPath}/${newFileName}` : newFileName

  return {
    newItem: {
      name: newFileName,
      fullPath: itemFullPath,
      publicUrl: urlData.publicUrl,
      type: isVid ? "video" : "image",
      size: fileData.size,
      createdAt: new Date().toISOString(),
    },
  }
}

/**
 * Rename a gallery folder by creating a new folder and moving all files to it.
 */
export async function renameGalleryFolder(
  folderPath: string,
  newName: string
): Promise<{ newFolder?: GalleryFolder; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const cleanName = newName.replace(/[^a-zA-Z0-9_\- ]/g, "").trim()
  if (!cleanName) return { error: "Invalid folder name" }

  // Build old and new prefixes
  const pathParts = folderPath.split("/")
  pathParts.pop() // remove old folder name
  const parentPath = pathParts.join("/")

  const oldPrefix = `gallery/${user.id}/${folderPath}`
  const newFolderPath = parentPath ? `${parentPath}/${cleanName}` : cleanName
  const newPrefix = `gallery/${user.id}/${newFolderPath}`

  const supabase = createAdminClient()

  // List all files in old folder (recursively)
  // Guard at depth 5 to prevent runaway recursion in unexpectedly deep nesting
  async function collectAll(prefix: string, depth = 0): Promise<string[]> {
    if (depth > 5) return []
    const { data } = await supabase.storage
      .from(GALLERY_BUCKET)
      .list(prefix, { limit: 1000 })
    if (!data) return []

    const paths: string[] = []
    for (const item of data) {
      const itemPath = `${prefix}/${item.name}`
      // In Supabase Storage, null metadata indicates a folder (pseudo-directory)
      if (item.metadata === null) {
        const sub = await collectAll(itemPath, depth + 1)
        paths.push(...sub)
      } else {
        paths.push(itemPath)
      }
    }
    return paths
  }

  const oldPaths = await collectAll(oldPrefix)
  // Also include .keep
  oldPaths.push(`${oldPrefix}/.keep`)

  // Create new folder .keep
  const keepFile = new Blob([""], { type: "text/plain" })
  await supabase.storage.from(GALLERY_BUCKET).upload(`${newPrefix}/.keep`, keepFile, { contentType: "text/plain" })

  // Move each file: download then upload to new path
  for (const oldPath of oldPaths) {
    if (oldPath.endsWith("/.keep")) continue
    const relativePath = oldPath.slice(oldPrefix.length)
    const newPath = `${newPrefix}${relativePath}`

    const { data: fileData } = await supabase.storage.from(GALLERY_BUCKET).download(oldPath)
    if (fileData) {
      await supabase.storage.from(GALLERY_BUCKET).upload(newPath, fileData, {
        contentType: fileData.type || "application/octet-stream",
      })
    }
  }

  // Delete all old files
  if (oldPaths.length > 0) {
    await supabase.storage.from(GALLERY_BUCKET).remove(oldPaths)
  }

  // Update the folder record in gallery_folders table and return the cover_image
  const { data: updatedRecord, error: dbError } = await supabase
    .from("gallery_folders")
    .update({ folder_name: cleanName, folder_path: newFolderPath })
    .eq("seller_id", user.id)
    .eq("folder_path", folderPath)
    .select("cover_image")
    .maybeSingle()

  if (dbError) return { error: dbError.message }

  return { newFolder: { name: cleanName, fullPath: newFolderPath, coverImage: updatedRecord?.cover_image ?? null } }
}

/**
 * Get image count and linked products count for each folder at the given path.
 * Returns a map of folder fullPath -> { imageCount, linkedProductsCount }.
 */
export async function getGalleryFolderStats(
  folderPaths: string[]
): Promise<Record<string, GalleryFolderStats>> {
  const user = await getCurrentUser()
  if (!user) return {}

  const supabase = createAdminClient()
  const result: Record<string, GalleryFolderStats> = {}

  // Fetch image counts from storage for each folder in parallel
  const imageCountPromises = folderPaths.map(async (folderPath) => {
    const prefix = `gallery/${user.id}/${folderPath}`
    const { data } = await supabase.storage.from(GALLERY_BUCKET).list(prefix, {
      limit: 1000,
      offset: 0,
    })
    // Count only files (non-folders), exclude .keep placeholder
    const count = (data ?? []).filter(
      (item) => item.metadata !== null && item.name !== ".keep"
    ).length
    return { folderPath, count }
  })

  const imageCounts = await Promise.all(imageCountPromises)
  for (const { folderPath, count } of imageCounts) {
    result[folderPath] = { imageCount: count, linkedProductsCount: 0 }
  }

  // Build the public URL base for each folder to query product_images
  const folderUrlPatterns = folderPaths.map((folderPath) => {
    const storagePath = `gallery/${user.id}/${folderPath}/`
    const { data: urlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(storagePath)
    return { folderPath, urlPrefix: urlData.publicUrl }
  })

  // Query linked products for each folder in parallel
  // Each folder has a unique URL prefix, so we run separate queries concurrently
  const linkedCountPromises = folderUrlPatterns.map(async ({ folderPath, urlPrefix }) => {
    const { data } = await supabase
      .from("product_images")
      .select("product_id")
      .like("image_url", `${urlPrefix}%`)

    // Count distinct product_ids
    const uniqueProductIds = new Set((data ?? []).map((row: { product_id: string }) => row.product_id))
    return { folderPath, count: uniqueProductIds.size }
  })

  const linkedCounts = await Promise.all(linkedCountPromises)
  for (const { folderPath, count } of linkedCounts) {
    if (result[folderPath]) {
      result[folderPath].linkedProductsCount = count
    }
  }

  return result
}
