"use client"

import { X, Package } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { toCategoryKey } from "@/lib/categories"

interface PinnedCategoriesBarProps {
  pinnedCategories: string[]
  categoryImageMap?: Record<string, string | null>
  onSelect: (category: string) => void
  onUnpin: (category: string) => void
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

export function PinnedCategoriesBar({
  pinnedCategories,
  categoryImageMap,
  onSelect,
  onUnpin,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: PinnedCategoriesBarProps) {
  const t = useTranslations("catalog")
  const tCatNames = useTranslations("categoryNames")
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  const translateCat = (name: string): string => {
    const key = toCategoryKey(name)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translated = (tCatNames as any)(key)
    return typeof translated === "string" && translated !== key ? translated : name
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex flex-wrap items-center gap-3 min-h-[80px] rounded-lg border-2 border-dashed px-3 py-3 transition-colors ${
        isDragOver
          ? "border-primary bg-primary/10"
          : pinnedCategories.length > 0
            ? "border-muted bg-muted/30"
            : "border-muted-foreground/25 bg-muted/10"
      }`}
    >
      {pinnedCategories.length === 0 && !isDragOver && (
        <span className="text-xs text-muted-foreground">{t("dropHereToPin")}</span>
      )}
      {isDragOver && pinnedCategories.length === 0 && (
        <span className="text-xs text-primary font-medium">{t("dropHereToPin")}</span>
      )}
      {pinnedCategories.map((cat) => {
        const imgUrl = categoryImageMap?.[cat] ?? null
        const showImage = imgUrl && !failedImages.has(cat)
        return (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat)}
          className="group inline-flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          {showImage ? (
            <div className="w-[60px] h-[60px] rounded-md bg-white flex items-center justify-center shrink-0">
              <Image
                src={imgUrl}
                alt={translateCat(cat)}
                width={60}
                height={60}
                className="rounded-md object-contain w-[60px] h-[60px]"
                onError={() => setFailedImages((prev) => new Set(prev).add(cat))}
              />
            </div>
          ) : (
            <div className="w-[60px] h-[60px] rounded-md bg-white flex items-center justify-center shrink-0">
              <Package className="h-8 w-8 text-primary" />
            </div>
          )}
          <span>{translateCat(cat)}</span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onUnpin(cat)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation()
                onUnpin(cat)
              }
            }}
            className="inline-flex items-center justify-center rounded-full hover:bg-primary/30 p-0.5 transition-colors"
            title={t("unpinCategory")}
          >
            <X className="h-3 w-3" />
          </span>
        </button>
        )
      })}
    </div>
  )
}
