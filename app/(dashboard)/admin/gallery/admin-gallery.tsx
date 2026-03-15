"use client"

import { useState, useRef } from "react"
import NextImage from "next/image"
import { useTranslations } from "next-intl"
import {
  FolderOpen,
  FolderPlus,
  Upload,
  Trash2,
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Link2,
  Search,
  Camera,
  Wand2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { SiteCategory } from "@/lib/actions/site-settings"
import type { AdminGalleryFolder, AdminGalleryImage, AutoMatchResult, SingleMatchResult } from "@/lib/actions/admin-gallery"
import {
  createAdminGalleryFolder,
  deleteAdminGalleryFolder,
  updateAdminFolderCover,
  listFolderImages,
  uploadImageToFolder,
  deleteImageFromFolder,
  linkImageToCategory,
  autoMatchFolderImages,
  renameAdminGalleryImage,
  autoMatchSingleImage,
} from "@/lib/actions/admin-gallery"

/* ────────────────────────── Props ────────────────────────── */

interface Props {
  initialFolders: AdminGalleryFolder[]
  categories: SiteCategory[]
}

/* ────────────────────────── Component ────────────────────── */

export function AdminGallery({ initialFolders, categories }: Props) {
  const t = useTranslations("adminGallery")

  /* ── state ──────────────────────────────────────────────── */
  const [folders, setFolders] = useState<AdminGalleryFolder[]>(initialFolders)

  // active folder
  const [activeFolder, setActiveFolder] = useState<AdminGalleryFolder | null>(null)
  const [folderImages, setFolderImages] = useState<AdminGalleryImage[]>([])
  const [loadingImages, setLoadingImages] = useState(false)

  // create folder dialog
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [creating, setCreating] = useState(false)

  // delete folder
  const [deletingFolder, setDeletingFolder] = useState<AdminGalleryFolder | null>(null)
  const [deleting, setDeleting] = useState(false)

  // cover image
  const [editCoverFolder, setEditCoverFolder] = useState<AdminGalleryFolder | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // uploading images
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // link category dialog
  const [linkCatOpen, setLinkCatOpen] = useState(false)
  const [linkSubCatOpen, setLinkSubCatOpen] = useState(false)
  const [linkSubSubCatOpen, setLinkSubSubCatOpen] = useState(false)
  const [linkImage, setLinkImage] = useState<AdminGalleryImage | null>(null)
  const [catSearch, setCatSearch] = useState("")

  // auto-match
  const [matching, setMatching] = useState(false)
  const [matchResult, setMatchResult] = useState<AutoMatchResult | null>(null)
  const [matchingCardFolder, setMatchingCardFolder] = useState<string | null>(null)

  // rename
  const [renamingImage, setRenamingImage] = useState<AdminGalleryImage | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [renameLoading, setRenameLoading] = useState(false)

  // delete confirmation
  const [deletingImage, setDeletingImage] = useState<AdminGalleryImage | null>(null)
  const [deletingImageLoading, setDeletingImageLoading] = useState(false)

  // toast
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null)

  // match name (single image)
  const [matchNameImage, setMatchNameImage] = useState<AdminGalleryImage | null>(null)
  const [matchNameResult, setMatchNameResult] = useState<SingleMatchResult | null>(null)
  const [matchNameLoading, setMatchNameLoading] = useState(false)
  const [matchNameConfirmOpen, setMatchNameConfirmOpen] = useState(false)

  // Pre-compute parent lookup for O(n) category classification
  const parentIdMap = new Map<string, string | null>()
  for (const c of categories) parentIdMap.set(c.id, c.parent_id)

  const mainCategories = categories.filter((c) => !c.parent_id)
  const subCategories = categories.filter((c) => c.parent_id && !parentIdMap.get(c.parent_id))
  const subSubCategories = categories.filter((c) => {
    if (!c.parent_id) return false
    return parentIdMap.get(c.parent_id) != null
  })

  /* ── helpers ────────────────────────────────────────────── */

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  async function openFolder(folder: AdminGalleryFolder) {
    setActiveFolder(folder)
    setLoadingImages(true)
    setFolderImages([])
    const { images, error } = await listFolderImages(folder.folder_path)
    if (error) showToast("error", error)
    setFolderImages(images)
    setLoadingImages(false)
  }

  /* ── folder CRUD ────────────────────────────────────────── */

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return
    setCreating(true)
    const { folder, error } = await createAdminGalleryFolder(newFolderName.trim())
    if (error) {
      showToast("error", error)
    } else if (folder) {
      setFolders((prev) => [folder, ...prev])
      showToast("success", t("folderCreated"))
    }
    setNewFolderName("")
    setShowNewFolder(false)
    setCreating(false)
  }

  async function handleDeleteFolder() {
    if (!deletingFolder) return
    setDeleting(true)
    const { error } = await deleteAdminGalleryFolder(deletingFolder.id)
    if (error) {
      showToast("error", error)
    } else {
      setFolders((prev) => prev.filter((f) => f.id !== deletingFolder.id))
      if (activeFolder?.id === deletingFolder.id) {
        setActiveFolder(null)
        setFolderImages([])
      }
      showToast("success", t("folderDeleted"))
    }
    setDeletingFolder(null)
    setDeleting(false)
  }

  /* ── cover image ────────────────────────────────────────── */

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editCoverFolder || !e.target.files?.[0]) return
    const formData = new FormData()
    formData.append("file", e.target.files[0])
    const { url, error } = await updateAdminFolderCover(editCoverFolder.id, formData)
    if (error) {
      showToast("error", error)
    } else if (url) {
      const freshUrl = `${url}?t=${Date.now()}`
      setFolders((prev) =>
        prev.map((f) => (f.id === editCoverFolder.id ? { ...f, cover_image: freshUrl } : f))
      )
      showToast("success", t("coverUpdated"))
    }
    setEditCoverFolder(null)
  }

  /* ── upload images to folder ────────────────────────────── */

  async function processFiles(files: File[]) {
    if (!activeFolder || files.length === 0) return
    const imageFiles = files.filter((f) => f.type.startsWith("image/"))
    if (imageFiles.length === 0) {
      showToast("error", t("onlyImagesAllowed"))
      return
    }
    setUploading(true)
    setUploadProgress({ current: 0, total: imageFiles.length })
    for (let i = 0; i < imageFiles.length; i++) {
      setUploadProgress({ current: i + 1, total: imageFiles.length })
      const formData = new FormData()
      formData.append("file", imageFiles[i])
      const { image, error } = await uploadImageToFolder(activeFolder.folder_path, formData)
      if (error) {
        showToast("error", error)
      } else if (image) {
        setFolderImages((prev) => [...prev, image])
      }
    }
    showToast("success", t("uploadSuccess"))
    setUploading(false)
    setUploadProgress(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!activeFolder || !e.target.files?.length) return
    await processFiles(Array.from(e.target.files))
  }

  /* ── drag & drop handlers ───────────────────────────────── */

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files) as File[]
    await processFiles(files)
  }


  /* ── link to category / subcategory ─────────────────────── */

  function openLinkCategory(img: AdminGalleryImage) {
    setLinkImage(img)
    setCatSearch("")
    setLinkCatOpen(true)
  }

  function openLinkSubcategory(img: AdminGalleryImage) {
    setLinkImage(img)
    setCatSearch("")
    setLinkSubCatOpen(true)
  }

  function openLinkSubSubcategory(img: AdminGalleryImage) {
    setLinkImage(img)
    setCatSearch("")
    setLinkSubSubCatOpen(true)
  }

  async function assignToCategory(categoryId: string) {
    if (!linkImage) return
    const { error } = await linkImageToCategory(linkImage.publicUrl, categoryId)
    if (error) {
      showToast("error", error)
    } else {
      showToast("success", t("imageLinked"))
    }
    setLinkCatOpen(false)
    setLinkSubCatOpen(false)
    setLinkSubSubCatOpen(false)
    setLinkImage(null)
  }

  /* ── auto-match ─────────────────────────────────────────── */

  async function handleAutoMatch() {
    if (!activeFolder) return
    setMatching(true)
    setMatchResult(null)
    const result = await autoMatchFolderImages(activeFolder.folder_path)
    if (result.error) {
      showToast("error", result.error)
    } else {
      setMatchResult(result)
    }
    setMatching(false)
  }

  async function handleAutoMatchFromCard(folder: AdminGalleryFolder) {
    setMatchingCardFolder(folder.id)
    const result = await autoMatchFolderImages(folder.folder_path)
    if (result.error) {
      showToast("error", result.error)
    } else {
      showToast(
        "success",
        t("matchSummaryDetailed", {
          matched: result.matched,
          unmatched: result.unmatched,
          categories: result.matchedCategories,
          subcategories: result.matchedSubcategories,
          subSubcategories: result.matchedSubSubcategories,
        })
      )
    }
    setMatchingCardFolder(null)
  }

  /* ── match name (single image) ──────────────────────────── */

  async function handleMatchName(img: AdminGalleryImage) {
    setMatchNameImage(img)
    setMatchNameLoading(true)
    setMatchNameResult(null)
    const result = await autoMatchSingleImage(img.name)
    setMatchNameLoading(false)
    if (result.error) {
      showToast("error", result.error)
      setMatchNameImage(null)
      return
    }
    if (result.found) {
      setMatchNameResult(result)
      setMatchNameConfirmOpen(true)
    } else {
      // Show "No match found" that auto-dismisses after 2 seconds
      setToast({ type: "error", msg: t("noMatchFound") })
      setTimeout(() => setToast(null), 2000)
      setMatchNameImage(null)
    }
  }

  function resetMatchNameState() {
    setMatchNameConfirmOpen(false)
    setMatchNameImage(null)
    setMatchNameResult(null)
  }

  async function handleConfirmMatchName() {
    if (!matchNameImage || !matchNameResult?.categoryId) return
    const { error } = await linkImageToCategory(matchNameImage.publicUrl, matchNameResult.categoryId)
    if (error) {
      showToast("error", error)
    } else {
      showToast("success", t("imageLinked"))
    }
    resetMatchNameState()
  }

  function handleCancelMatchName() {
    resetMatchNameState()
  }

  /* ── rename image ─────────────────────────────────────────── */

  function openRenameImage(img: AdminGalleryImage) {
    // Strip the leading timestamp prefix for the default rename value
    const nameWithoutTs = img.name.replace(/^\d+-/, "")
    setRenamingImage(img)
    setRenameValue(nameWithoutTs)
  }

  async function handleRenameImage() {
    if (!renamingImage || !renameValue.trim()) return
    setRenameLoading(true)
    const { image, error } = await renameAdminGalleryImage(renamingImage.fullPath, renameValue.trim())
    if (error) {
      showToast("error", error)
    } else if (image) {
      setFolderImages((prev) =>
        prev.map((i) => (i.fullPath === renamingImage.fullPath ? image : i))
      )
      showToast("success", t("imageRenamed"))
    }
    setRenamingImage(null)
    setRenameValue("")
    setRenameLoading(false)
  }

  /* ── delete image with confirmation ─────────────────────── */

  async function handleConfirmDeleteImage() {
    if (!deletingImage) return
    setDeletingImageLoading(true)
    const { error } = await deleteImageFromFolder(deletingImage.fullPath)
    if (error) {
      showToast("error", error)
    } else {
      setFolderImages((prev) => prev.filter((i) => i.fullPath !== deletingImage.fullPath))
    }
    setDeletingImage(null)
    setDeletingImageLoading(false)
  }

  /* ── filtered categories ────────────────────────────────── */

  function handleBackToFolders() {
    setActiveFolder(null)
    setFolderImages([])
    setMatchResult(null)
  }

  const filteredMainCats = mainCategories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  )
  const filteredSubCats = subCategories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  )
  const filteredSubSubCats = subSubCategories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  )

  /* ────────────────────── RENDER ─────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg text-sm font-medium",
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          )}
        >
          {toast.msg}
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverUpload}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
        {!activeFolder && (
          <Button onClick={() => setShowNewFolder(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            {t("createFolder")}
          </Button>
        )}
      </div>

      {/* ─── Folder grid (when no folder is open) ─── */}
      {!activeFolder && (
        <>
          {folders.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title={t("emptyGallery")}
              description={t("emptyGalleryDesc")}
              action={{ label: t("createFolder"), onClick: () => setShowNewFolder(true) }}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className={cn(
                    "relative rounded-lg border transition-colors group cursor-pointer",
                    folder.cover_image
                      ? "overflow-hidden aspect-square"
                      : "flex flex-col items-center gap-2 p-3 hover:bg-accent text-center"
                  )}
                >
                  {folder.cover_image ? (
                    <button
                      onClick={() => openFolder(folder)}
                      className="relative w-full h-full"
                    >
                      <NextImage
                        src={folder.cover_image}
                        alt={folder.folder_name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-8">
                        <span className="text-sm font-bold truncate block text-white">
                          {folder.folder_name}
                        </span>
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={() => openFolder(folder)}
                      className="flex flex-col items-center gap-2 w-full"
                    >
                      <FolderOpen className="h-10 w-10 text-yellow-500 group-hover:text-yellow-400" />
                      <span className="text-sm font-bold truncate w-full">
                        {folder.folder_name}
                      </span>
                    </button>
                  )}

                  {/* Action buttons overlay */}
                  <div className="absolute top-1 end-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAutoMatchFromCard(folder)
                      }}
                      disabled={matchingCardFolder === folder.id}
                      className="p-1 rounded bg-violet-500/80 hover:bg-violet-500"
                      title={t("matchAll")}
                    >
                      {matchingCardFolder === folder.id
                        ? <Loader2 className="h-3 w-3 text-white animate-spin" />
                        : <Wand2 className="h-3 w-3 text-white" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditCoverFolder(folder)
                        setTimeout(() => coverInputRef.current?.click(), 50)
                      }}
                      className="p-1 rounded bg-emerald-500/80 hover:bg-emerald-500"
                      title={t("editCover")}
                    >
                      <Camera className="h-3 w-3 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletingFolder(folder)
                      }}
                      className="p-1 rounded bg-destructive/80 hover:bg-destructive"
                      title={t("deleteFolder")}
                    >
                      <Trash2 className="h-3 w-3 text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Inside a folder ─── */}
      {activeFolder && (
        <div
          className="space-y-4"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Breadcrumb + actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={handleBackToFolders}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}
            </Button>
            <span className="text-lg font-semibold">{activeFolder.folder_name}</span>
            <div className="ml-auto flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={handleAutoMatch}
                disabled={matching || folderImages.length === 0}
              >
                {matching ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1" />}
                {t("matchAll")}
              </Button>
              <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                {t("uploadImages")}
              </Button>
            </div>
          </div>

          {/* Drag & drop zone */}
          <div
            className={cn(
              "relative rounded-lg border-2 border-dashed p-6 text-center transition-colors",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
            onClick={() => !uploading && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click() } }}
          >
            <Upload className={cn("mx-auto h-8 w-8 mb-2", isDragOver ? "text-primary" : "text-muted-foreground")} />
            <p className={cn("text-sm font-medium", isDragOver ? "text-primary" : "text-muted-foreground")}>
              {isDragOver ? t("dropZoneActive") : t("dropZoneText")}
            </p>
          </div>

          {/* Upload progress */}
          {uploading && uploadProgress && (
            <div className="space-y-2 rounded-md bg-muted p-3">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("uploadingProgress", { current: uploadProgress.current, total: uploadProgress.total })}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted-foreground/20">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Match result summary */}
          {matchResult && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted text-sm">
              <Wand2 className="h-4 w-4" />
              <span>{t("matchSummaryDetailed", {
                matched: matchResult.matched,
                unmatched: matchResult.unmatched,
                categories: matchResult.matchedCategories,
                subcategories: matchResult.matchedSubcategories,
                subSubcategories: matchResult.matchedSubSubcategories,
              })}</span>
              <Button size="sm" variant="ghost" className="ml-auto h-6 w-6 p-0" onClick={() => setMatchResult(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Loading */}
          {loadingImages && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty folder */}
          {!loadingImages && folderImages.length === 0 && !uploading && (
            <EmptyState
              icon={ImageIcon}
              title={t("emptyFolder")}
              description={t("emptyFolderDesc")}
              action={{ label: t("uploadImages"), onClick: () => fileInputRef.current?.click() }}
            />
          )}

          {/* Image grid */}
          {!loadingImages && folderImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {folderImages.map((img) => (
                <Card key={img.fullPath} className="group relative overflow-hidden">
                  <div className="relative w-full aspect-square bg-muted">
                    <NextImage
                      src={img.publicUrl}
                      alt={img.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs truncate" title={img.name}>{img.name}</p>
                  </div>
                  {/* Action overlay - icon toolbar */}
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1.5">
                    <button
                      onClick={() => openLinkCategory(img)}
                      className="p-1.5 rounded bg-blue-500/80 hover:bg-blue-500 transition-colors"
                      title={t("linkToCategory")}
                    >
                      <Link2 className="h-3.5 w-3.5 text-white" />
                    </button>
                    <button
                      onClick={() => openLinkSubcategory(img)}
                      className="p-1.5 rounded bg-indigo-500/80 hover:bg-indigo-500 transition-colors"
                      title={t("linkToSubcategory")}
                    >
                      <Link2 className="h-3.5 w-3.5 text-white" />
                    </button>
                    <button
                      onClick={() => openLinkSubSubcategory(img)}
                      className="p-1.5 rounded bg-violet-500/80 hover:bg-violet-500 transition-colors"
                      title={t("linkToSubSubcategory")}
                    >
                      <Link2 className="h-3.5 w-3.5 text-white" />
                    </button>
                    <button
                      onClick={() => handleMatchName(img)}
                      className="p-1.5 rounded bg-emerald-500/80 hover:bg-emerald-500 transition-colors"
                      title={t("matchName")}
                      disabled={matchNameLoading && matchNameImage?.fullPath === img.fullPath}
                    >
                      {matchNameLoading && matchNameImage?.fullPath === img.fullPath ? (
                        <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                      ) : (
                        <Wand2 className="h-3.5 w-3.5 text-white" />
                      )}
                    </button>
                    <button
                      onClick={() => openRenameImage(img)}
                      className="p-1.5 rounded bg-amber-500/80 hover:bg-amber-500 transition-colors"
                      title={t("rename")}
                    >
                      <Pencil className="h-3.5 w-3.5 text-white" />
                    </button>
                    <button
                      onClick={() => setDeletingImage(img)}
                      className="p-1.5 rounded bg-destructive/80 hover:bg-destructive transition-colors"
                      title={t("delete")}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Create Folder Dialog ─── */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createFolder")}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t("folderNamePlaceholder")}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>{t("cancel")}</Button>
            <Button onClick={handleCreateFolder} disabled={creating || !newFolderName.trim()}>
              {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              {t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Folder Dialog ─── */}
      <Dialog open={!!deletingFolder} onOpenChange={() => setDeletingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteFolder")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("deleteFolderConfirm", { name: deletingFolder?.folder_name ?? "" })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingFolder(null)}>{t("cancel")}</Button>
            <Button variant="destructive" onClick={handleDeleteFolder} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Link to Category Dialog ─── */}
      <Dialog open={linkCatOpen} onOpenChange={setLinkCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("linkToCategory")}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("searchCategories")}
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredMainCats.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">{t("noResults")}</p>
            )}
            {filteredMainCats.map((cat) => (
              <button
                key={cat.id}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm flex items-center gap-2"
                onClick={() => assignToCategory(cat.id)}
              >
                {cat.image_url ? (
                  <NextImage src={cat.image_url} alt="" width={24} height={24} className="rounded object-cover" unoptimized />
                ) : (
                  <div className="w-6 h-6 rounded bg-muted-foreground/10 flex items-center justify-center">
                    <ImageIcon className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                {cat.name}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Link to Subcategory Dialog ─── */}
      <Dialog open={linkSubCatOpen} onOpenChange={setLinkSubCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("linkToSubcategory")}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("searchCategories")}
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredSubCats.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">{t("noResults")}</p>
            )}
            {filteredSubCats.map((cat) => {
              const parent = mainCategories.find((m) => m.id === cat.parent_id)
              return (
                <button
                  key={cat.id}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm flex items-center gap-2"
                  onClick={() => assignToCategory(cat.id)}
                >
                  {cat.image_url ? (
                    <NextImage src={cat.image_url} alt="" width={24} height={24} className="rounded object-cover" unoptimized />
                  ) : (
                    <div className="w-6 h-6 rounded bg-muted-foreground/10 flex items-center justify-center">
                      <ImageIcon className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                  <span>
                    {cat.name}
                    {parent && <span className="text-muted-foreground ml-1">({parent.name})</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Link to Sub-subcategory Dialog ─── */}
      <Dialog open={linkSubSubCatOpen} onOpenChange={setLinkSubSubCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("linkToSubSubcategory")}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("searchCategories")}
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredSubSubCats.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">{t("noResults")}</p>
            )}
            {filteredSubSubCats.map((cat) => {
              const parent = categories.find((c) => c.id === cat.parent_id)
              const grandParent = parent ? categories.find((c) => c.id === parent.parent_id) : null
              return (
                <button
                  key={cat.id}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm flex items-center gap-2"
                  onClick={() => assignToCategory(cat.id)}
                >
                  {cat.image_url ? (
                    <NextImage src={cat.image_url} alt="" width={24} height={24} className="rounded object-cover" unoptimized />
                  ) : (
                    <div className="w-6 h-6 rounded bg-muted-foreground/10 flex items-center justify-center">
                      <ImageIcon className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                  <span>
                    {cat.name}
                    {parent && (
                      <span className="text-muted-foreground ml-1">
                        ({grandParent ? `${grandParent.name} › ` : ""}{parent.name})
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Rename Image Dialog ─── */}
      <Dialog open={!!renamingImage} onOpenChange={() => { setRenamingImage(null); setRenameValue("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rename")}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t("renameImagePlaceholder")}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRenameImage()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRenamingImage(null); setRenameValue("") }}>{t("cancel")}</Button>
            <Button onClick={handleRenameImage} disabled={renameLoading || !renameValue.trim()}>
              {renameLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              {t("rename")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Image Confirmation Dialog ─── */}
      <Dialog open={!!deletingImage} onOpenChange={() => setDeletingImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteImage")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("deleteImageConfirm", { name: deletingImage?.name ?? "" })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingImage(null)}>{t("cancel")}</Button>
            <Button variant="destructive" onClick={handleConfirmDeleteImage} disabled={deletingImageLoading}>
              {deletingImageLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Match Name Confirmation Dialog ─── */}
      <Dialog open={matchNameConfirmOpen} onOpenChange={(open) => { if (!open) handleCancelMatchName() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("matchName")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            {t("matchNameConfirm", { name: matchNameResult?.categoryName ?? "" })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelMatchName}>{t("escape")}</Button>
            <Button onClick={handleConfirmMatchName}>{t("yes")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
