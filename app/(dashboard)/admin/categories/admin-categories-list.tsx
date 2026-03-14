"use client"

import { useState, useRef } from "react"
import NextImage from "next/image"
import { useTranslations } from "next-intl"
import {
  FolderTree, Plus, Pencil, Trash2, GripVertical,
  Upload, X, Image as ImageIcon, ChevronDown, ChevronRight, Video,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import type { SiteCategory } from "@/lib/actions/site-settings"
import {
  createSiteCategory,
  updateSiteCategory,
  deleteSiteCategory,
  reorderSiteCategories,
  uploadCategoryImage,
  removeCategoryImage,
  createVideoSignedUploadUrl,
  finalizeVideoUpload,
  removeSiteVideo,
} from "@/lib/actions/site-settings"
import { createClient } from "@/lib/supabase/client"

interface Props {
  categories: SiteCategory[]
  videoUrl: string
  productCounts: Record<string, number>
}

export function AdminCategoriesList({ categories: initialCategories, videoUrl: initialVideoUrl, productCounts }: Props) {
  const t = useTranslations("adminCategories")
  const [categories, setCategories] = useState(initialCategories)
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null)

  // Dialog states
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)

  // Form states
  const [formName, setFormName] = useState("")
  const [formParentId, setFormParentId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<SiteCategory | null>(null)

  // Expanded main categories
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // File refs
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [imageTarget, setImageTarget] = useState<string | null>(null)
  const imageTargetRef = useRef<string | null>(null)
  const [imageInputKey, setImageInputKey] = useState(0)

  const mainCategories = categories.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order)
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order)

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ─── CRUD handlers ─────────────────────────────────────

  async function handleAdd() {
    if (!formName.trim()) return
    setLoading(true)
    const siblings = formParentId
      ? getSubcategories(formParentId)
      : mainCategories
    const sortOrder = siblings.length > 0 ? Math.max(...siblings.map((c) => c.sort_order)) + 1 : 0
    const res = await createSiteCategory(formName.trim(), formParentId, sortOrder)
    if (res.error) {
      showToast("error", res.error)
    } else if (res.category) {
      setCategories((prev) => [...prev, res.category!])
      showToast("success", `Created "${formName.trim()}"`)
      setAddOpen(false)
      setFormName("")
      setFormParentId(null)
    }
    setLoading(false)
  }

  async function handleEdit() {
    if (!selectedCategory || !formName.trim()) return
    setLoading(true)
    const res = await updateSiteCategory(selectedCategory.id, { name: formName.trim() })
    if (res.error) {
      showToast("error", res.error)
    } else {
      setCategories((prev) =>
        prev.map((c) => (c.id === selectedCategory.id ? { ...c, name: formName.trim() } : c))
      )
      showToast("success", `Updated to "${formName.trim()}"`)
      setEditOpen(false)
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!selectedCategory) return
    setLoading(true)
    const res = await deleteSiteCategory(selectedCategory.id)
    if (res.error) {
      showToast("error", res.error)
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== selectedCategory.id && c.parent_id !== selectedCategory.id))
      showToast("success", `Deleted "${selectedCategory.name}"`)
      setDeleteOpen(false)
    }
    setLoading(false)
  }

  // ─── Reorder handlers ─────────────────────────────────

  async function moveCategory(id: string, direction: "up" | "down", parentId: string | null) {
    const siblings = parentId
      ? getSubcategories(parentId)
      : mainCategories
    const idx = siblings.findIndex((c) => c.id === id)
    if (idx < 0) return
    const targetIdx = direction === "up" ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= siblings.length) return

    const reordered = [...siblings]
    const temp = reordered[idx]
    reordered[idx] = reordered[targetIdx]
    reordered[targetIdx] = temp

    const updates = reordered.map((c, i) => ({ id: c.id, sort_order: i }))
    setCategories((prev) =>
      prev.map((c) => {
        const u = updates.find((u) => u.id === c.id)
        return u ? { ...c, sort_order: u.sort_order } : c
      })
    )

    const res = await reorderSiteCategories(updates)
    if (res.error) showToast("error", res.error)
  }

  // ─── Image handlers ────────────────────────────────────

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const target = imageTargetRef.current
    if (!target || !e.target.files?.[0]) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", e.target.files[0])
      const res = await uploadCategoryImage(target, formData)
      if (res.error) {
        showToast("error", res.error)
      } else if (res.url) {
        // Append cache-busting param so the browser doesn't show a stale cached image
        const freshUrl = `${res.url!}?t=${Date.now()}`
        setCategories((prev) =>
          prev.map((c) => (c.id === target ? { ...c, image_url: freshUrl } : c))
        )
        showToast("success", t("imageUploaded"))
      }
    } catch {
      showToast("error", t("imageUploadFailed"))
    }
    imageTargetRef.current = null
    setImageTarget(null)
    setLoading(false)
    setImageInputKey((k) => k + 1)
  }

  async function handleRemoveImage(id: string) {
    setLoading(true)
    try {
      const res = await removeCategoryImage(id)
      if (res.error) {
        showToast("error", res.error)
      } else {
        setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, image_url: null } : c)))
        showToast("success", t("imageRemoved"))
      }
    } catch {
      showToast("error", t("imageRemoveFailed"))
    }
    setLoading(false)
    setImageInputKey((k) => k + 1)
  }

  // ─── Video handlers ────────────────────────────────────

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return
    setLoading(true)
    const file = e.target.files[0]
    try {
      const ext = file.name.split(".").pop() || "mp4"

      // Get a signed upload URL from the server (avoids Next.js body size limits)
      const signedResult = await createVideoSignedUploadUrl(ext)
      if (signedResult.error) {
        showToast("error", signedResult.error)
        setLoading(false)
        if (videoInputRef.current) videoInputRef.current.value = ""
        return
      }

      // Upload the file directly to Supabase Storage using the signed URL
      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .uploadToSignedUrl(signedResult.path!, signedResult.token!, file, {
          contentType: file.type || "video/mp4",
        })

      if (uploadError) {
        showToast("error", uploadError.message)
        setLoading(false)
        if (videoInputRef.current) videoInputRef.current.value = ""
        return
      }

      // Save the public URL to site settings
      const finalResult = await finalizeVideoUpload(signedResult.filePath!)
      if (finalResult.error) {
        showToast("error", finalResult.error)
      } else if (finalResult.url) {
        setVideoUrl(finalResult.url)
        showToast("success", t("videoUploaded"))
      }
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : t("videoUploadFailed"))
    }
    setLoading(false)
    if (videoInputRef.current) videoInputRef.current.value = ""
  }

  async function handleRemoveVideo() {
    setLoading(true)
    try {
      const res = await removeSiteVideo()
      if (res.error) {
        showToast("error", res.error)
      } else {
        setVideoUrl("")
        showToast("success", t("videoRemoved"))
      }
    } catch {
      showToast("error", t("videoRemoveFailed"))
    }
    setVideoDialogOpen(false)
    setLoading(false)
  }

  // ─── Category Row ──────────────────────────────────────

  function CategoryRow({ cat, isMain }: { cat: SiteCategory; isMain: boolean }) {
    const subs = isMain ? getSubcategories(cat.id) : []
    const isExpanded = expanded.has(cat.id)
    const siblings = cat.parent_id ? getSubcategories(cat.parent_id) : mainCategories
    const idx = siblings.findIndex((c) => c.id === cat.id)

    return (
      <>
        <div
          className={`flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors ${
            !isMain ? "pl-12" : ""
          }`}
        >
          {/* Drag handle indicator */}
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />

          {/* Expand/collapse for main categories */}
          {isMain ? (
            <button onClick={() => toggleExpanded(cat.id)} className="shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Category image */}
          {cat.image_url ? (
            <NextImage
              src={cat.image_url}
              alt={cat.name}
              width={48}
              height={48}
              className="h-12 w-12 rounded-md object-cover border border-border shrink-0"
              unoptimized
            />
          ) : (
            <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center border border-border shrink-0">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}

          {/* Name */}
          <span className={`flex-1 text-sm ${isMain ? "font-medium" : "text-muted-foreground"}`}>
            {cat.name}
          </span>

          {/* Sub count */}
          {isMain && subs.length > 0 && (
            <span className="text-xs text-muted-foreground mr-2">
              {subs.length !== 1 ? t("subsCount", { count: subs.length }) : t("subCount", { count: subs.length })}
            </span>
          )}

          {/* Product count for subcategories */}
          {!isMain && (
            <span className="text-xs text-muted-foreground mr-2">
              {(productCounts[cat.name] ?? 0) !== 1
                ? t("productsCount", { count: productCounts[cat.name] ?? 0 })
                : t("productCount", { count: 1 })}
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Move up/down */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={idx === 0}
              onClick={() => moveCategory(cat.id, "up", cat.parent_id)}
              title={t("moveUp")}
            >
              <span className="text-xs">↑</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={idx === siblings.length - 1}
              onClick={() => moveCategory(cat.id, "down", cat.parent_id)}
              title={t("moveDown")}
            >
              <span className="text-xs">↓</span>
            </Button>

            {/* Upload image */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                imageTargetRef.current = cat.id
                setImageTarget(cat.id)
                imageInputRef.current?.click()
              }}
              title={t("uploadImage")}
            >
              <Upload className="h-3.5 w-3.5" />
            </Button>

            {/* Remove image */}
            {cat.image_url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleRemoveImage(cat.id)}
                title={t("removeImage")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* Edit */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setSelectedCategory(cat)
                setFormName(cat.name)
                setEditOpen(true)
              }}
              title={t("edit")}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => {
                setSelectedCategory(cat)
                setDeleteOpen(true)
              }}
              title={t("delete2")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            {/* Add subcategory (main only) */}
            {isMain && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setFormParentId(cat.id)
                  setFormName("")
                  setAddOpen(true)
                }}
                title={t("addSubcategoryBtn")}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Subcategories */}
        {isMain && isExpanded &&
          subs.map((sub) => <CategoryRow key={sub.id} cat={sub} isMain={false} />)
        }
      </>
    )
  }

  // ─── Render ────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm shadow-lg ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-destructive text-destructive-foreground"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        key={imageInputKey}
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoUpload}
      />

      {/* ─── Homepage Video Section ───────────────────── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{t("homepageVideo")}</h2>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => videoInputRef.current?.click()}
              disabled={loading}
            >
              <Upload className="h-4 w-4 mr-1" />
              {videoUrl ? t("replaceVideo") : t("uploadVideo")}
            </Button>
            {videoUrl && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setVideoDialogOpen(true)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t("remove")}
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          {t("videoDesc")}
        </p>
        {videoUrl ? (
          <div className="rounded-lg overflow-hidden border border-border max-w-xl">
            <video className="w-full" controls preload="metadata" playsInline>
              <source src={videoUrl} type="video/mp4" />
            </video>
            <p className="text-xs text-muted-foreground px-3 py-2 bg-muted truncate">
              {videoUrl}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {t("noVideoSet")}
          </p>
        )}
      </Card>

      {/* ─── Categories Management ────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{t("title")}</h2>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setFormParentId(null)
              setFormName("")
              setAddOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t("addCategory")}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {t("managementDesc")}
        </p>

        {mainCategories.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title={t("noCategories")}
            description={t("noCategoriesDesc")}
          />
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            {mainCategories.map((cat) => (
              <CategoryRow key={cat.id} cat={cat} isMain />
            ))}
          </div>
        )}
      </Card>

      {/* ─── Add Dialog ───────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formParentId ? t("addSubcategory") : t("addCategory")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">{t("subcategoryName")}</label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={t("categoryNamePlaceholder")}
              className="mt-1"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            {formParentId && (
              <p className="text-xs text-muted-foreground mt-2">
                {t("addingUnder", { name: categories.find((c) => c.id === formParentId)?.name ?? "" })}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleAdd} disabled={loading || !formName.trim()}>
              {loading ? t("creating") : t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Dialog ──────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editCategory")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">{t("subcategoryName")}</label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={t("categoryNamePlaceholder")}
              className="mt-1"
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleEdit} disabled={loading || !formName.trim()}>
              {loading ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Dialog ────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteCategory")}</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-muted-foreground">
            {t("deleteConfirm", { name: selectedCategory?.name ?? "" })}
            {!selectedCategory?.parent_id && " " + t("deleteSubcategoriesWarning")}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? t("deleting") : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Remove Video Dialog ──────────────────────── */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("removeVideoTitle")}</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-muted-foreground">
            {t("removeVideoConfirm")}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleRemoveVideo} disabled={loading}>
              {loading ? t("removing") : t("remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
