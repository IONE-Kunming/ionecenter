"use client"

import { useState, useRef, useTransition, useEffect, useCallback } from "react"
import NextImage from "next/image"
import { useTranslations } from "next-intl"
import {
  FolderOpen, FolderPlus, Upload, Trash2, ArrowLeft, Image as ImageIcon,
  Video, Loader2, ChevronRight, File, Pencil, Link2, CheckSquare, Star,
  Search,
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
} from "@/lib/actions/gallery"
import type { GalleryItem, GalleryFolder } from "@/lib/actions/gallery"
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

  // Bulk select state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [showBulkAssign, setShowBulkAssign] = useState(false)
  const [bulkProductSearch, setBulkProductSearch] = useState("")
  const [bulkProductResults, setBulkProductResults] = useState<{ id: string; name: string; model_number: string; image_url: string | null }[]>([])
  const [bulkSelectedProductId, setBulkSelectedProductId] = useState<string | null>(null)
  const [bulkPrimaryUrl, setBulkPrimaryUrl] = useState<string | null>(null)
  const [bulkLinking, setBulkLinking] = useState(false)

  // Breadcrumb segments
  const segments = currentPath ? currentPath.split("/") : []

  // Clear success message after timeout
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

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
    const result = await createGalleryFolder(folderName.trim(), currentPath)
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
    setShowNewFolder(false)
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

  // ── Auto-match handler ──
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

      {/* New folder input */}
      {showNewFolder && (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/40">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("folderName")}
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="flex-1 h-8"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder()
              if (e.key === "Escape") { setShowNewFolder(false); setFolderName("") }
            }}
            autoFocus
          />
          <Button size="sm" onClick={handleCreateFolder} disabled={creating}>
            {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : t("create")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowNewFolder(false); setFolderName("") }}>
            {t("cancel")}
          </Button>
        </div>
      )}

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
                      <FolderOpen className="h-10 w-10 text-yellow-500 group-hover:text-yellow-400" />
                      <span className="text-xs font-medium truncate w-full">{folder.name}</span>
                    </button>
                    {/* Folder action buttons */}
                    <div className="absolute top-1 end-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
    </div>
  )
}
