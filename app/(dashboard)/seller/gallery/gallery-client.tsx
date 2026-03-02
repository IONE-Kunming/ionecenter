"use client"

import { useState, useRef, useTransition } from "react"
import NextImage from "next/image"
import { useTranslations } from "next-intl"
import {
  FolderOpen, FolderPlus, Upload, Trash2, ArrowLeft, Image as ImageIcon,
  Video, Loader2, ChevronRight, File,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import {
  listGallery,
  uploadGalleryFile,
  createGalleryFolder,
  deleteGalleryFile,
} from "@/lib/actions/gallery"
import type { GalleryItem, GalleryFolder } from "@/lib/actions/gallery"

interface GalleryClientProps {
  initialFolders: GalleryFolder[]
  initialFiles: GalleryItem[]
  currentPath: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function GalleryClient({ initialFolders, initialFiles, currentPath: initPath }: GalleryClientProps) {
  const t = useTranslations("gallery")
  const [folders, setFolders] = useState<GalleryFolder[]>(initialFolders)
  const [files, setFiles] = useState<GalleryItem[]>(initialFiles)
  const [currentPath, setCurrentPath] = useState(initPath)
  const [loading, startLoad] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [folderName, setFolderName] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Breadcrumb segments
  const segments = currentPath ? currentPath.split("/") : []

  function navigateTo(path: string) {
    setError(null)
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
    try {
      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folderPath", currentPath)
        const result = await uploadGalleryFile(formData)
        if (result.error) {
          setError(result.error)
          break
        }
        if (result.item) {
          setFiles((prev) => [...prev, result.item!])
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

  const isEmpty = folders.length === 0 && files.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
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
              <button
                key={folder.fullPath}
                onClick={() => navigateTo(folder.fullPath)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors text-center group"
              >
                <FolderOpen className="h-10 w-10 text-yellow-500 group-hover:text-yellow-400" />
                <span className="text-xs font-medium truncate w-full">{folder.name}</span>
              </button>
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
                className="group relative rounded-lg border overflow-hidden bg-muted/30 hover:shadow-md transition-all"
              >
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
                  <p className="text-xs font-medium truncate" title={item.name}>{item.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(item.size)}</p>
                </div>

                {/* Actions overlay */}
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
                    onClick={() => handleDelete(item)}
                    className="p-1.5 rounded bg-destructive/80 hover:bg-destructive transition-colors"
                    title={t("delete")}
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
