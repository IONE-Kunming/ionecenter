"use client"

import { X, Package } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { toCategoryKey } from "@/lib/categories"

interface PinnedCategoriesBarProps {
  pinnedCategories: string[]
  categoryImageMap?: Record<string, string | null>
  categoryMap?: Record<string, string[]>
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
  categoryMap,
  onSelect,
  onUnpin,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: PinnedCategoriesBarProps) {
  const t = useTranslations("catalog")
  const tCatNames = useTranslations("categoryNames")

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
      className={`flex items-stretch gap-4 min-h-[80px] rounded-lg border-2 border-dashed px-3 py-3 transition-colors overflow-x-auto ${
        isDragOver
          ? "border-primary bg-primary/10"
          : pinnedCategories.length > 0
            ? "border-muted bg-muted/30"
            : "border-muted-foreground/25 bg-muted/10"
      }`}
    >
      {pinnedCategories.length === 0 && !isDragOver && (
        <span className="text-xs text-muted-foreground self-center">{t("dropHereToPin")}</span>
      )}
      {isDragOver && pinnedCategories.length === 0 && (
        <span className="text-xs text-primary font-medium self-center">{t("dropHereToPin")}</span>
      )}
      {pinnedCategories.map((cat) => {
        const imageUrl = categoryImageMap?.[cat] ?? null
        const subcategories = categoryMap?.[cat] ?? []
        return (
          <Card
            key={cat}
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden shrink-0 w-[260px]"
            onClick={() => onSelect(cat)}
          >
            <CardContent className="p-0 relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onUnpin(cat)
                }}
                className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-md bg-black/50 text-white hover:bg-black/70"
                title={t("unpinCategory")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {imageUrl ? (
                <div className="relative h-[160px]">
                  <Image
                    src={imageUrl}
                    alt={translateCat(cat)}
                    fill
                    className="object-cover"
                    sizes="260px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-semibold text-white">{translateCat(cat)}</h3>
                    <p className="text-sm text-white/80">
                      {subcategories.length} {t("subcategories")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center h-[160px] flex flex-col items-center justify-center">
                  <Package className="h-10 w-10 mx-auto text-primary" />
                  <h3 className="mt-4 font-semibold text-base">{translateCat(cat)}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {subcategories.length} {t("subcategories")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
