"use client"

import { useState, useRef, useTransition, useEffect, useCallback } from "react"
import NextImage from "next/image"
import { useTranslations } from "next-intl"
import {
  FolderOpen, FolderPlus, Upload, Trash2, ArrowLeft, Image as ImageIcon,
  Video, Loader2, ChevronRight, File, Pencil, Link2, CheckSquare, Star,
  Search, Camera,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty-state"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useFormatters } from "@/lib/use-formatters"
import {
  listGallery,
  uploadGalleryFile,
  createGallerySignedUploadUrl,
  finalizeGalleryUpload,
  createGalleryFolder,
  deleteGalleryFile,
  deleteGalleryFolder,
  renameGalleryFile,
  renameGalleryFolder,
  getGalleryFolderStats,
  uploadFolderCoverImage,
} from "@/lib/actions/gallery"
import type { GalleryItem, GalleryFolder, GalleryFolderStats } from "@/lib/actions/gallery"
import {
  searchSellerProductsForGallery,
  assignImagesToProduct,
  autoMatchFolderToProduct,
} from "@/lib/actions/product-images"
import { createClient } from "@/lib/supabase/client"

interface GalleryClientProps {
  initialFolders: GalleryFolder[]
  initialFiles: GalleryItem[]
  currentPath: string
}

function formatBytes(bytes: number, formatNumber?: (n: number) => string): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1))
  return `${formatNumber ? formatNumber(val) : val} ${sizes[i]}`
}

export function GalleryClient({ initialFolders, initialFiles, currentPath: initPath }: GalleryClientProps) {
  const t = useTranslations("gallery")
  const { formatCurrency: _fc } = useFormatters()
  const locale = typeof document !== "undefined" ? document.documentElement.lang : "en-US"
  const [folders, setFolders] = useState<GalleryFolder[]>(initialFolders)
  const [files, setFiles] = useState<GalleryItem[]>(initialFiles)
  const [currentPath, setCurrentPath] = useState(initPath)
  const [loading, startLoad] = useTransition()
  const [uploading, setUploading] = useState(false)
  const formatNum = (n: number) => n.toLocaleString(locale === "ar" ? "ar-EG" : locale)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [folderName, setFolderName] = useState("")
  const [creating, setCreating] = useState(false)
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Rename state
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null)
  const [renamingFile, setRenamingFile] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [renameLoading, setRenameLoading] = useState(false)

  // Link to product state
  const [linkFolderPath, setLinkFolderPath] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState("")
  const [productResults, setProductResults] = useState<{ id: string; name: string; model_number: string; image_url: string | null }[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null)
  const [linkImages, setLinkImages] = useState<GalleryItem[]>([])
  const [linking, setLinking] = useState(false)
  const [autoMatching, setAutoMatching] = useState<string | null>(null)
  const [autoMatchingFile, setAutoMatchingFile] = useState<string | null>(null)

  // Bulk select state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [showBulkAssign, setShowBulkAssign] = useState(false)
  const [bulkProductSearch, setBulkProductSearch] = useState("")
  const [bulkProductResults, setBulkProductResults] = useState<{ id: string; name: string; model_number: string; image_url: string | null }[]>([])
  const [bulkSelectedProductId, setBulkSelectedProductId] = useState<string | null>(null)
  const [bulkPrimaryUrl, setBulkPrimaryUrl] = useState<string | null>(null)
  const [bulkLinking, setBulkLinking] = useState(false)

  // Folder stats (image count + linked products count)
  const [folderStats, setFolderStats] = useState<Record<string, GalleryFolderStats>>({})

  // Cover image state for create folder dialog
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Edit cover image state
  const [editCoverFolder, setEditCoverFolder] = useState<GalleryFolder | null>(null)
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null)
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null)
  const [editCoverLoading, setEditCoverLoading] = useState(false)
  const editCoverInputRef = useRef<HTMLInputElement>(null)

  // Breadcrumb segments
  const segments = currentPath ? currentPath.split("/") : []

  // Clear success message after timeout
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  // Fetch folder stats when folders change
  const fetchFolderStats = useCallback(async (folderList: GalleryFolder[]) => {
    if (folderList.length === 0) {
      setFolderStats({})
      return
    }
    const paths = folderList.map((f) => f.fullPath)
    const stats = await getGalleryFolderStats(paths)
    setFolderStats(stats)
  }, [])

  useEffect(() => {
    fetchFolderStats(folders)
  }, [folders, fetchFolderStats])

  function navigateTo(path: string) {
    setError(null)
    setSelectionMode(false)
    setSelectedFiles(new Set())
    startLoad(async () => {
      const result = await listGallery(path)
      if (result.error) {
        setError(result.error)
        return
      }
      setCurrentPath(path)
      setFolders(result.folders)
      setFiles(result.files)
    })
  }

  function navigateToSegment(index: number) {
    const path = segments.slice(0, index + 1).join("/")
    navigateTo(path)
  }

  function navigateUp() {
    const parentSegments = segments.slice(0, -1)
    navigateTo(parentSegments.join("/"))
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files ?? [])
    if (selectedFiles.length === 0) return
    setError(null)
    setUploading(true)
    const supabase = createClient()
    try {
      for (const file of selectedFiles) {
        const isImage = file.type.startsWith("image/")
        const isVideo = file.type.startsWith("video/")
        if (!isImage && !isVideo) {
          setError(t("onlyImagesVideos"))
          break
        }
        const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")
        const signedResult = await createGallerySignedUploadUrl(ext, currentPath, file.name)
        if (signedResult.error || !signedResult.storagePath || !signedResult.token || !signedResult.path) {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("folderPath", currentPath)
          const result = await uploadGalleryFile(formData)
          if (result.error) { setError(result.error); break }
          if (result.item) setFiles((prev) => [...prev, result.item!])
          continue
        }
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .uploadToSignedUrl(signedResult.path, signedResult.token, file, { contentType: file.type })
        if (uploadError) {
          setError(uploadError.message)
          break
        }
        const finalResult = await finalizeGalleryUpload(signedResult.storagePath, file.size, currentPath)
        if (finalResult.error) { setError(finalResult.error); break }
        if (finalResult.item) {
          setFiles((prev) => [...prev, finalResult.item!])
        }
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleCreateFolder() {
    if (!folderName.trim()) {
      setError(t("noFolderName"))
      return
    }
    setCreating(true)
    setError(null)

    // If there's a cover image, upload it first
    let coverImageUrl: string | undefined
    if (coverImageFile) {
      const formData = new FormData()
      formData.append("file", coverImageFile)
      // We need the folder path that will be created
      const cleanName = folderName.trim().replace(/[^a-zA-Z0-9_\- ]/g, "").trim()
      const fullPath = currentPath ? `${currentPath}/${cleanName}` : cleanName
      formData.append("folderPath", fullPath)
      const coverResult = await uploadFolderCoverImage(formData)
      if (coverResult.error) {
        setError(coverResult.error)
        setCreating(false)
        return
      }
      coverImageUrl = coverResult.coverImageUrl
    }

    const result = await createGalleryFolder(folderName.trim(), currentPath, coverImageUrl)
    setCreating(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.folder) {
      setFolders((prev) => {
        if (prev.some((f) => f.fullPath === result.folder!.fullPath)) return prev
        return [...prev, result.folder!]
      })
    }
    setFolderName("")
    setCoverImageFile(null)
    setCoverImagePreview(null)
    setShowNewFolder(false)
  }

  // ── Edit cover image handler ──
  async function handleEditCoverSubmit() {
    if (!editCoverFolder || !editCoverFile) return
    setEditCoverLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", editCoverFile)
    formData.append("folderPath", editCoverFolder.fullPath)
    const result = await uploadFolderCoverImage(formData)
    setEditCoverLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    // Update the folder in state with the new cover image
    setFolders((prev) =>
      prev.map((f) =>
        f.fullPath === editCoverFolder.fullPath
          ? { ...f, coverImage: result.coverImageUrl ?? null }
          : f
      )
    )
    setSuccessMsg(t("coverImageUpdated"))
    setEditCoverFolder(null)
    setEditCoverFile(null)
    setEditCoverPreview(null)
  }

  async function handleDelete(item: GalleryItem) {
    if (!window.confirm(t("deleteConfirm"))) return
    setError(null)
    const result = await deleteGalleryFile(item.fullPath)
    if (result.error) {
      setError(result.error)
      return
    }
    setFiles((prev) => prev.filter((f) => f.fullPath !== item.fullPath))
  }

  async function handleDeleteFolder(folder: GalleryFolder) {
    if (!window.confirm(t("deleteFolderConfirm"))) return
    setError(null)
    setDeletingFolder(folder.fullPath)
    const result = await deleteGalleryFolder(folder.fullPath)
    setDeletingFolder(null)
    if (result.error) {
      setError(result.error)
      return
    }
    setFolders((prev) => prev.filter((f) => f.fullPath !== folder.fullPath))
  }

  // ── Rename handlers ──
  async function handleRenameFolder(folder: GalleryFolder) {
    if (!renameValue.trim()) return
    setRenameLoading(true)
    setError(null)
    const result = await renameGalleryFolder(folder.fullPath, renameValue.trim())
    setRenameLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.newFolder) {
      setFolders((prev) => prev.map((f) =>
        f.fullPath === folder.fullPath ? result.newFolder! : f
      ))
    }
    setRenamingFolder(null)
    setRenameValue("")
  }

  async function handleRenameFile(item: GalleryItem) {
    if (!renameValue.trim()) return
    setRenameLoading(true)
    setError(null)
    const result = await renameGalleryFile(item.fullPath, renameValue.trim())
    setRenameLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.newItem) {
      setFiles((prev) => prev.map((f) =>
        f.fullPath === item.fullPath ? result.newItem! : f
      ))
    }
    setRenamingFile(null)
    setRenameValue("")
  }

  // ── Auto-match handler (folder) ──
  async function handleAutoMatch(folder: GalleryFolder) {
    setAutoMatching(folder.fullPath)
    setError(null)
    const matches = await autoMatchFolderToProduct(folder.name)
    setAutoMatching(null)
    if (matches.length === 1) {
      const match = matches[0]
      setSuccessMsg(t("autoMatchFound", { product: `${match.name} (${match.model_number})` }))
      // Open the link dialog pre-loaded with this product
      await openLinkDialog(folder, match.id)
    } else if (matches.length > 1) {
      // Multiple matches — open dialog with matches shown so seller can choose
      setSuccessMsg(t("autoMatchMultiple"))
      await openLinkDialogWithMatches(folder, matches)
    } else {
      setError(t("autoMatchNotFound"))
    }
  }

  // ── Auto-match handler (individual file) ──
  async function handleAutoMatchFile(item: GalleryItem) {
    if (item.type !== "image") return
    setAutoMatchingFile(item.fullPath)
    setError(null)

    // Strip timestamp prefix to get the original filename
    const cleanName = displayName(item.name)
    const matches = await autoMatchFolderToProduct(cleanName)
    setAutoMatchingFile(null)

    if (matches.length === 1) {
      const match = matches[0]
      // Directly assign the single image to the matched product
      const result = await assignImagesToProduct([item.publicUrl], match.id, null)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccessMsg(t("autoMatchFileFound", { product: `${match.name} (${match.model_number})` }))
        // Refresh folder stats after auto-matching a file
        fetchFolderStats(folders)
      }
    } else if (matches.length > 1) {
      // Multiple matches — open dialog with this single file and matches for seller to choose
      setSuccessMsg(t("autoMatchMultiple"))
      openSingleFileLinkDialogWithMatches(item, matches)
    } else {
      setError(t("autoMatchFileNotFound"))
    }
  }

  // ── Link to Product handler ──
  const searchProducts = useCallback(async (query: string, setter: (results: { id: string; name: string; model_number: string; image_url: string | null }[]) => void) => {
    const results = await searchSellerProductsForGallery(query)
    setter(results)
  }, [])

  async function openLinkDialog(folder: GalleryFolder, preSelectedProductId?: string) {
    setLinkFolderPath(folder.fullPath)
    setProductSearch("")
    setSelectedProductId(preSelectedProductId ?? null)
    setPrimaryImageUrl(null)
    setLinkImages([])

    // Fetch images in this folder
    const result = await listGallery(folder.fullPath)
    if (!result.error) {
      const images = result.files.filter((f) => f.type === "image")
      setLinkImages(images)
      // Don't auto-select primary – keep existing primary unless seller explicitly picks one
    }

    // Load initial product list
    const products = await searchSellerProductsForGallery("")
    setProductResults(products)
  }

  async function openLinkDialogWithMatches(
    folder: GalleryFolder,
    matches: { id: string; name: string; model_number: string }[]
  ) {
    setLinkFolderPath(folder.fullPath)
    setProductSearch("")
    setSelectedProductId(null)
    setPrimaryImageUrl(null)
    setLinkImages([])

    // Fetch images in this folder
    const result = await listGallery(folder.fullPath)
    if (!result.error) {
      const images = result.files.filter((f) => f.type === "image")
      setLinkImages(images)
    }

    // Pre-populate the product list with the matching products
    setProductResults(matches.map((m) => ({ ...m, image_url: null })))
  }

  // ── Single file link dialog ──
  async function openSingleFileLinkDialog(item: GalleryItem) {
    setLinkFolderPath("__single_file__")
    setProductSearch("")
    setSelectedProductId(null)
    setPrimaryImageUrl(null)
    setLinkImages([item])

    // Load initial product list
    const products = await searchSellerProductsForGallery("")
    setProductResults(products)
  }

  function openSingleFileLinkDialogWithMatches(
    item: GalleryItem,
    matches: { id: string; name: string; model_number: string }[]
  ) {
    setLinkFolderPath("__single_file__")
    setProductSearch("")
    setSelectedProductId(null)
    setPrimaryImageUrl(null)
    setLinkImages([item])

    // Pre-populate the product list with the matching products
    setProductResults(matches.map((m) => ({ ...m, image_url: null })))
  }

  async function handleLinkToProduct() {
    if (!selectedProductId || linkImages.length === 0) return
    setLinking(true)
    setError(null)

    const imageUrls = linkImages.map((img) => img.publicUrl)
    const result = await assignImagesToProduct(imageUrls, selectedProductId, primaryImageUrl)

    setLinking(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSuccessMsg(t("assignSuccess"))
    setLinkFolderPath(null)
    // Refresh folder stats after linking images to a product
    fetchFolderStats(folders)
  }

  // ── Bulk select + assign ──
  function toggleFileSelection(fullPath: string) {
    setSelectedFiles((prev) => {
      const next = new Set(prev)
      if (next.has(fullPath)) next.delete(fullPath)
      else next.add(fullPath)
      return next
    })
  }

  function openBulkAssignDialog() {
    const selectedImages = files.filter((f) => selectedFiles.has(f.fullPath) && f.type === "image")
    if (selectedImages.length === 0) return
    setShowBulkAssign(true)
    setBulkProductSearch("")
    setBulkSelectedProductId(null)
    setBulkPrimaryUrl(selectedImages[0].publicUrl)
    searchProducts("", setBulkProductResults)
  }

  async function handleBulkAssign() {
    if (!bulkSelectedProductId) return
    setBulkLinking(true)
    setError(null)

    const selectedImages = files.filter((f) => selectedFiles.has(f.fullPath) && f.type === "image")
    const imageUrls = selectedImages.map((img) => img.publicUrl)
    const primary = bulkPrimaryUrl ?? imageUrls[0]
    const result = await assignImagesToProduct(imageUrls, bulkSelectedProductId, primary)

    setBulkLinking(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSuccessMsg(t("assignSuccess"))
    setShowBulkAssign(false)
    setSelectionMode(false)
    setSelectedFiles(new Set())
    // Refresh folder stats after bulk assigning images to a product
    fetchFolderStats(folders)
  }

  // Helper to strip timestamp prefix from filename for display
  function displayName(name: string): string {
    const match = name.match(/^\d+-(.+)$/)
    return match ? match[1] : name
  }

  const isEmpty = folders.length === 0 && files.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!selectionMode && files.some((f) => f.type === "image") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSelectionMode(true); setSelectedFiles(new Set()) }}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {t("bulkSelect")}
            </Button>
          )}
          {selectionMode && (
            <>
              <Button variant="outline" size="sm" onClick={() => { setSelectionMode(false); setSelectedFiles(new Set()) }}>
                {t("cancelSelection")}
              </Button>
              {selectedFiles.size > 0 && (
                <Button size="sm" onClick={openBulkAssignDialog}>
                  <Link2 className="h-4 w-4 mr-2" />
                  {t("assignToProduct")} ({t("selectedCount", { count: selectedFiles.size })})
                </Button>
              )}
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewFolder((v) => !v)}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            {t("newFolder")}
          </Button>
          <Button
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {uploading ? t("uploading") : t("uploadFiles")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showNewFolder} onOpenChange={(v) => { if (!v) { setShowNewFolder(false); setFolderName(""); setCoverImageFile(null); setCoverImagePreview(null) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("newFolder")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("folderName")}</label>
              <Input
                placeholder={t("folderName")}
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder()
                }}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("folderCoverImage")}</label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setCoverImageFile(file)
                    const reader = new FileReader()
                    reader.onload = (ev) => setCoverImagePreview(ev.target?.result as string)
                    reader.readAsDataURL(file)
                  }
                  if (coverInputRef.current) coverInputRef.current.value = ""
                }}
              />
              {coverImagePreview ? (
                <div
                  className="relative w-full h-40 rounded-lg border overflow-hidden cursor-pointer group"
                  onClick={() => coverInputRef.current?.click()}
                >
                  <NextImage src={coverImagePreview} alt="Cover preview" fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-xs">{t("clickToUploadCover")}</span>
                </button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNewFolder(false); setFolderName(""); setCoverImageFile(null); setCoverImagePreview(null) }}>
              {t("cancel")}
            </Button>
            <Button onClick={handleCreateFolder} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FolderPlus className="h-4 w-4 mr-2" />}
              {creating ? t("creating") : t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success message */}
      {successMsg && (
        <div className="rounded-md bg-green-500/10 text-green-700 dark:text-green-400 px-4 py-2 text-sm">{successMsg}</div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm">{error}</div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm">
        <button
          onClick={() => navigateTo("")}
          className={cn("hover:underline text-muted-foreground", !currentPath && "text-foreground font-medium")}
        >
          {t("root")}
        </button>
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <button
              onClick={() => navigateToSegment(i)}
              className={cn(
                "hover:underline text-muted-foreground",
                i === segments.length - 1 && "text-foreground font-medium"
              )}
            >
              {seg}
            </button>
          </span>
        ))}
      </div>

      {/* Back button */}
      {currentPath && (
        <Button variant="ghost" size="sm" onClick={navigateUp} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Button>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && isEmpty && (
        <EmptyState
          icon={ImageIcon}
          title={currentPath ? t("emptyFolder") : t("emptyGallery")}
          description={currentPath ? t("emptyFolderDesc") : t("emptyGalleryDesc")}
          className="py-16"
        />
      )}

      {/* Folders */}
      {!loading && folders.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {t("folders")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {folders.map((folder) => (
              <div
                key={folder.fullPath}
                className="relative flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors text-center group"
              >
                {renamingFolder === folder.fullPath ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <FolderOpen className="h-10 w-10 text-yellow-500" />
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="h-7 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameFolder(folder)
                        if (e.key === "Escape") { setRenamingFolder(null); setRenameValue("") }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button size="sm" variant="default" className="h-6 text-xs px-2" onClick={() => handleRenameFolder(folder)} disabled={renameLoading}>
                        {renameLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : t("rename")}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => { setRenamingFolder(null); setRenameValue("") }}>
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => navigateTo(folder.fullPath)}
                      onDoubleClick={(e) => { e.preventDefault(); setRenamingFolder(folder.fullPath); setRenameValue(folder.name) }}
                      className="flex flex-col items-center gap-2 w-full"
                    >
                      {folder.coverImage ? (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden border">
                          <NextImage src={folder.coverImage} alt={folder.name} fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <FolderOpen className="h-10 w-10 text-yellow-500 group-hover:text-yellow-400" />
                      )}
                      <span className="text-xs font-medium truncate w-full">{folder.name}</span>
                      {/* Folder stats: image count & linked products */}
                      {folderStats[folder.fullPath] && (
                        <div className="flex flex-col items-center gap-0.5 w-full">
                          <span className="text-[10px] text-muted-foreground">
                            {folderStats[folder.fullPath].imageCount} {t("images").toLowerCase()}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {folderStats[folder.fullPath].linkedProductsCount} {t("products").toLowerCase()}
                          </span>
                        </div>
                      )}
                    </button>
                    {/* Folder action buttons */}
                    <div className="absolute top-1 end-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditCoverFolder(folder); setEditCoverFile(null); setEditCoverPreview(folder.coverImage ?? null) }}
                        className="p-1 rounded bg-green-600/80 hover:bg-green-600"
                        title={t("editCover")}
                      >
                        <Camera className="h-3 w-3 text-white" />
                      </button>
                      <button
                        onClick={() => handleAutoMatch(folder)}
                        disabled={autoMatching === folder.fullPath}
                        className="p-1 rounded bg-blue-500/80 hover:bg-blue-500"
                        title={t("autoMatch")}
                      >
                        {autoMatching === folder.fullPath
                          ? <Loader2 className="h-3 w-3 text-white animate-spin" />
                          : <Star className="h-3 w-3 text-white" />}
                      </button>
                      <button
                        onClick={() => openLinkDialog(folder)}
                        className="p-1 rounded bg-primary/80 hover:bg-primary"
                        title={t("linkToProduct")}
                      >
                        <Link2 className="h-3 w-3 text-white" />
                      </button>
                      <button
                        onClick={() => { setRenamingFolder(folder.fullPath); setRenameValue(folder.name) }}
                        className="p-1 rounded bg-orange-500/80 hover:bg-orange-500"
                        title={t("renameFolder")}
                      >
                        <Pencil className="h-3 w-3 text-white" />
                      </button>
                      <button
                        onClick={() => handleDeleteFolder(folder)}
                        disabled={deletingFolder === folder.fullPath}
                        className="p-1 rounded bg-destructive/80 hover:bg-destructive"
                        title={t("deleteFolder")}
                      >
                        {deletingFolder === folder.fullPath
                          ? <Loader2 className="h-3 w-3 text-white animate-spin" />
                          : <Trash2 className="h-3 w-3 text-white" />}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {!loading && files.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {t("images")} &amp; {t("videos")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((item) => (
              <div
                key={item.fullPath}
                className={cn(
                  "group relative rounded-lg border overflow-hidden bg-muted/30 hover:shadow-md transition-all",
                  selectionMode && selectedFiles.has(item.fullPath) && "ring-2 ring-primary"
                )}
                onClick={selectionMode ? () => toggleFileSelection(item.fullPath) : undefined}
              >
                {/* Selection checkbox overlay */}
                {selectionMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      selectedFiles.has(item.fullPath) ? "bg-primary border-primary" : "bg-white/80 border-gray-400"
                    )}>
                      {selectedFiles.has(item.fullPath) && <CheckSquare className="h-3.5 w-3.5 text-primary-foreground" />}
                    </div>
                  </div>
                )}

                {/* Preview */}
                <div className="aspect-square overflow-hidden bg-muted flex items-center justify-center relative">
                  {item.type === "image" ? (
                    <NextImage
                      src={item.publicUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      unoptimized
                    />
                  ) : item.type === "video" ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Video className="h-10 w-10" />
                      <span className="text-xs">Video</span>
                    </div>
                  ) : (
                    <File className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="p-2">
                  {renamingFile === item.fullPath ? (
                    <div className="flex flex-col gap-1">
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="h-6 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameFile(item)
                          if (e.key === "Escape") { setRenamingFile(null); setRenameValue("") }
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex gap-1">
                        <Button size="sm" variant="default" className="h-5 text-[10px] px-1.5" onClick={(e) => { e.stopPropagation(); handleRenameFile(item) }} disabled={renameLoading}>
                          {renameLoading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : t("rename")}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-5 text-[10px] px-1.5" onClick={(e) => { e.stopPropagation(); setRenamingFile(null); setRenameValue("") }}>
                          {t("cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-medium truncate" title={displayName(item.name)}>{displayName(item.name)}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(item.size, formatNum)}</p>
                    </>
                  )}
                </div>

                {/* Actions overlay */}
                {!selectionMode && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 flex-wrap">
                    <a
                      href={item.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-white/20 hover:bg-white/30 transition-colors"
                      title={item.type === "image" ? t("images") : t("videos")}
                    >
                      {item.type === "image" ? (
                        <ImageIcon className="h-4 w-4 text-white" />
                      ) : (
                        <Video className="h-4 w-4 text-white" />
                      )}
                    </a>
                    {item.type === "image" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAutoMatchFile(item) }}
                        disabled={autoMatchingFile === item.fullPath}
                        className="p-1.5 rounded bg-blue-500/80 hover:bg-blue-500 transition-colors"
                        title={t("autoMatch")}
                      >
                        {autoMatchingFile === item.fullPath
                          ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                          : <Star className="h-4 w-4 text-white" />}
                      </button>
                    )}
                    {item.type === "image" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openSingleFileLinkDialog(item) }}
                        className="p-1.5 rounded bg-primary/80 hover:bg-primary transition-colors"
                        title={t("linkToProduct")}
                      >
                        <Link2 className="h-4 w-4 text-white" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setRenamingFile(item.fullPath); setRenameValue(displayName(item.name)) }}
                      className="p-1.5 rounded bg-orange-500/80 hover:bg-orange-500 transition-colors"
                      title={t("renameFile")}
                    >
                      <Pencil className="h-4 w-4 text-white" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded bg-destructive/80 hover:bg-destructive transition-colors"
                      title={t("delete")}
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link to Product Dialog */}
      <Dialog open={linkFolderPath !== null} onOpenChange={(v) => { if (!v) setLinkFolderPath(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("linkToProduct")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Product search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchProducts")}
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value)
                  searchProducts(e.target.value, setProductResults)
                }}
                className="pl-9"
              />
            </div>
            {/* Product list */}
            <div className="max-h-48 overflow-y-auto border rounded-lg">
              {productResults.length > 0 ? productResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors text-left",
                    selectedProductId === p.id && "bg-primary/10 text-primary"
                  )}
                >
                  <div className="w-8 h-8 rounded border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.image_url ? (
                      <NextImage src={p.image_url} alt="" width={32} height={32} className="object-cover" unoptimized />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.model_number}</p>
                  </div>
                </button>
              )) : (
                <p className="p-3 text-sm text-muted-foreground text-center">{t("noProductsFound")}</p>
              )}
            </div>

            {/* Image thumbnails - select primary */}
            {linkImages.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("markAsPrimary")}</p>
                <p className="text-xs text-muted-foreground mb-2">{t("keepExistingPrimary")}</p>
                <div className="flex gap-2 flex-wrap">
                  {linkImages.map((img) => (
                    <button
                      key={img.fullPath}
                      onClick={() => setPrimaryImageUrl(primaryImageUrl === img.publicUrl ? null : img.publicUrl)}
                      className={cn(
                        "relative w-16 h-16 rounded border overflow-hidden",
                        primaryImageUrl === img.publicUrl && "ring-2 ring-primary"
                      )}
                    >
                      <NextImage src={img.publicUrl} alt="" fill className="object-cover" unoptimized />
                      {primaryImageUrl === img.publicUrl && (
                        <div className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-[8px] text-center py-0.5">
                          {t("primary")}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkFolderPath(null)}>{t("cancel")}</Button>
            <Button onClick={handleLinkToProduct} disabled={linking || !selectedProductId || linkImages.length === 0}>
              {linking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
              {linking ? t("assigning") : t("assignImages")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign to Product Dialog */}
      <Dialog open={showBulkAssign} onOpenChange={(v) => { if (!v) setShowBulkAssign(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("assignToProduct")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Product search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchProducts")}
                value={bulkProductSearch}
                onChange={(e) => {
                  setBulkProductSearch(e.target.value)
                  searchProducts(e.target.value, setBulkProductResults)
                }}
                className="pl-9"
              />
            </div>
            <div className="max-h-48 overflow-y-auto border rounded-lg">
              {bulkProductResults.length > 0 ? bulkProductResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setBulkSelectedProductId(p.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors text-left",
                    bulkSelectedProductId === p.id && "bg-primary/10 text-primary"
                  )}
                >
                  <div className="w-8 h-8 rounded border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.image_url ? (
                      <NextImage src={p.image_url} alt="" width={32} height={32} className="object-cover" unoptimized />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.model_number}</p>
                  </div>
                </button>
              )) : (
                <p className="p-3 text-sm text-muted-foreground text-center">{t("noProductsFound")}</p>
              )}
            </div>

            {/* Selected images - mark primary */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {t("selectedCount", { count: selectedFiles.size })} — {t("markAsPrimary")}
              </p>
              <div className="flex gap-2 flex-wrap">
                {files.filter((f) => selectedFiles.has(f.fullPath) && f.type === "image").map((img) => (
                  <button
                    key={img.fullPath}
                    onClick={() => setBulkPrimaryUrl(img.publicUrl)}
                    className={cn(
                      "relative w-16 h-16 rounded border overflow-hidden",
                      bulkPrimaryUrl === img.publicUrl && "ring-2 ring-primary"
                    )}
                  >
                    <NextImage src={img.publicUrl} alt="" fill className="object-cover" unoptimized />
                    {bulkPrimaryUrl === img.publicUrl && (
                      <div className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-[8px] text-center py-0.5">
                        {t("primary")}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkAssign(false)}>{t("cancel")}</Button>
            <Button onClick={handleBulkAssign} disabled={bulkLinking || !bulkSelectedProductId}>
              {bulkLinking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
              {bulkLinking ? t("assigning") : t("assignImages")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Cover Image Dialog */}
      <Dialog open={editCoverFolder !== null} onOpenChange={(v) => { if (!v) { setEditCoverFolder(null); setEditCoverFile(null); setEditCoverPreview(null) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("changeCoverImage")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("uploadNewCover")}</p>
            <input
              ref={editCoverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setEditCoverFile(file)
                  const reader = new FileReader()
                  reader.onload = (ev) => setEditCoverPreview(ev.target?.result as string)
                  reader.readAsDataURL(file)
                }
                if (editCoverInputRef.current) editCoverInputRef.current.value = ""
              }}
            />
            {editCoverPreview ? (
              <div
                className="relative w-full h-48 rounded-lg border overflow-hidden cursor-pointer group"
                onClick={() => editCoverInputRef.current?.click()}
              >
                <NextImage src={editCoverPreview} alt="Cover preview" fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => editCoverInputRef.current?.click()}
                className="w-full h-40 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
              >
                <Upload className="h-6 w-6" />
                <span className="text-xs">{t("clickToUploadCover")}</span>
              </button>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditCoverFolder(null); setEditCoverFile(null); setEditCoverPreview(null) }}>
              {t("cancel")}
            </Button>
            <Button onClick={handleEditCoverSubmit} disabled={editCoverLoading || !editCoverFile}>
              {editCoverLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
              {editCoverLoading ? t("uploading") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
