"use client"

import { useState, useRef } from "react"
import NextImage from "next/image"
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
}

export function AdminCategoriesList({ categories: initialCategories, videoUrl: initialVideoUrl }: Props) {
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
        setCategories((prev) =>
          prev.map((c) => (c.id === target ? { ...c, image_url: res.url! } : c))
        )
        showToast("success", "Image uploaded")
      }
    } catch {
      showToast("error", "Failed to upload image. Please try again with a smaller file.")
    }
    imageTargetRef.current = null
    setImageTarget(null)
    setLoading(false)
    if (imageInputRef.current) imageInputRef.current.value = ""
  }

  async function handleRemoveImage(id: string) {
    setLoading(true)
    try {
      const res = await removeCategoryImage(id)
      if (res.error) {
        showToast("error", res.error)
      } else {
        setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, image_url: null } : c)))
        showToast("success", "Image removed")
      }
    } catch {
      showToast("error", "Failed to remove image")
    }
    setLoading(false)
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
        showToast("success", "Video uploaded to Supabase")
      }
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Failed to upload video")
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
        showToast("success", "Video removed — will use local fallback")
      }
    } catch {
      showToast("error", "Failed to remove video")
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
          className={`flex items-center gap-2 px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors ${
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

          {/* Image thumbnail */}
          {cat.image_url ? (
            <NextImage
              src={cat.image_url}
              alt={cat.name}
              width={32}
              height={32}
              className="h-8 w-8 rounded object-cover border border-border shrink-0"
              unoptimized
            />
          ) : (
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center border border-border shrink-0">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {/* Name */}
          <span className={`flex-1 text-sm ${isMain ? "font-medium" : "text-muted-foreground"}`}>
            {cat.name}
          </span>

          {/* Sub count */}
          {isMain && subs.length > 0 && (
            <span className="text-xs text-muted-foreground mr-2">
              {subs.length} sub{subs.length !== 1 ? "s" : ""}
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
              title="Move up"
            >
              <span className="text-xs">↑</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={idx === siblings.length - 1}
              onClick={() => moveCategory(cat.id, "down", cat.parent_id)}
              title="Move down"
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
              title="Upload image"
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
                title="Remove image"
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
              title="Edit"
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
              title="Delete"
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
                title="Add subcategory"
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
            <h2 className="text-lg font-semibold">Homepage Video</h2>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => videoInputRef.current?.click()}
              disabled={loading}
            >
              <Upload className="h-4 w-4 mr-1" />
              {videoUrl ? "Replace Video" : "Upload Video"}
            </Button>
            {videoUrl && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setVideoDialogOpen(true)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Upload a video to Supabase storage for the &quot;Ready to Start Trading?&quot; section. Videos served from Supabase CDN load faster globally.
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
            No Supabase video set — using local fallback (/Our Factory.mp4)
          </p>
        )}
      </Card>

      {/* ─── Categories Management ────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Categories & Subcategories</h2>
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
            Add Category
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Add, edit, reorder, and manage images for categories and subcategories. Use the arrow buttons to reorder, and the upload icon to set images.
        </p>

        {mainCategories.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="No categories yet"
            description="Add your first category to get started."
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
              {formParentId ? "Add Subcategory" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter category name"
              className="mt-1"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            {formParentId && (
              <p className="text-xs text-muted-foreground mt-2">
                Adding under: {categories.find((c) => c.id === formParentId)?.name}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={loading || !formName.trim()}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Dialog ──────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter category name"
              className="mt-1"
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading || !formName.trim()}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Dialog ────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-muted-foreground">
            Are you sure you want to delete &quot;{selectedCategory?.name}&quot;?
            {!selectedCategory?.parent_id && " All subcategories will also be deleted."}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Remove Video Dialog ──────────────────────── */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Homepage Video</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-muted-foreground">
            Are you sure? The homepage will revert to using the local video file.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveVideo} disabled={loading}>
              {loading ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
