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
import type { AdminGalleryFolder, AdminGalleryImage } from "@/lib/actions/admin-gallery"
import {
  createAdminGalleryFolder,
  deleteAdminGalleryFolder,
  updateAdminFolderCover,
  listFolderImages,
  uploadImageToFolder,
  deleteImageFromFolder,
  linkImageToCategory,
  autoMatchFolderImages,
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  // link category dialog
  const [linkCatOpen, setLinkCatOpen] = useState(false)
  const [linkSubCatOpen, setLinkSubCatOpen] = useState(false)
  const [linkImage, setLinkImage] = useState<AdminGalleryImage | null>(null)
  const [catSearch, setCatSearch] = useState("")

  // auto-match
  const [matching, setMatching] = useState(false)
  const [matchResult, setMatchResult] = useState<{ matched: number; unmatched: number } | null>(null)
  const [matchingCardFolder, setMatchingCardFolder] = useState<string | null>(null)

  // toast
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null)

  const mainCategories = categories.filter((c) => !c.parent_id)
  const subCategories = categories.filter((c) => c.parent_id)

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!activeFolder || !e.target.files?.length) return
    setUploading(true)
    const files = Array.from(e.target.files)
    for (const file of files) {
      const formData = new FormData()
      formData.append("file", file)
      const { image, error } = await uploadImageToFolder(activeFolder.folder_path, formData)
      if (error) {
        showToast("error", error)
      } else if (image) {
        setFolderImages((prev) => [...prev, image])
      }
    }
    showToast("success", t("uploadSuccess"))
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleDeleteImage(img: AdminGalleryImage) {
    const { error } = await deleteImageFromFolder(img.fullPath)
    if (error) {
      showToast("error", error)
    } else {
      setFolderImages((prev) => prev.filter((i) => i.fullPath !== img.fullPath))
    }
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
      setMatchResult({ matched: result.matched, unmatched: result.unmatched })
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
        t("matchSummary", { matched: result.matched, unmatched: result.unmatched })
      )
    }
    setMatchingCardFolder(null)
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
        <div className="space-y-4">
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

          {/* Match result summary */}
          {matchResult && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted text-sm">
              <Wand2 className="h-4 w-4" />
              <span>{t("matchSummary", { matched: matchResult.matched, unmatched: matchResult.unmatched })}</span>
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
          {!loadingImages && folderImages.length === 0 && (
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
                  {/* Action overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs"
                      onClick={() => openLinkCategory(img)}
                    >
                      <Link2 className="h-3 w-3 mr-1" /> {t("linkToCategory")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs"
                      onClick={() => openLinkSubcategory(img)}
                    >
                      <Link2 className="h-3 w-3 mr-1" /> {t("linkToSubcategory")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDeleteImage(img)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
    </div>
  )
}
