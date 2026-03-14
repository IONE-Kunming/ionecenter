"use client"

import { X, Package } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { toCategoryKey } from "@/lib/categories"

interface PinnedSubcategoriesBarProps {
  pinnedSubcategories: string[]
  categoryImageMap?: Record<string, string | null>
  productCountsBySubcategory?: Record<string, number>
  onSelect: (subcategory: string) => void
  onUnpin: (subcategory: string) => void
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

export function PinnedSubcategoriesBar({
  pinnedSubcategories,
  categoryImageMap,
  productCountsBySubcategory,
  onSelect,
  onUnpin,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: PinnedSubcategoriesBarProps) {
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
      className={`flex items-stretch gap-4 min-h-[72px] rounded-lg border-2 border-dashed px-3 py-3 transition-colors overflow-x-auto ${
        isDragOver
          ? "border-primary bg-primary/10"
          : pinnedSubcategories.length > 0
            ? "border-muted bg-muted/30"
            : "border-muted-foreground/25 bg-muted/10"
      }`}
    >
      {pinnedSubcategories.length === 0 && !isDragOver && (
        <span className="text-xs text-muted-foreground self-center">{t("dropHereToPinSubcategory")}</span>
      )}
      {isDragOver && pinnedSubcategories.length === 0 && (
        <span className="text-xs text-primary font-medium self-center">{t("dropHereToPinSubcategory")}</span>
      )}
      {pinnedSubcategories.map((sub) => {
        const imageUrl = categoryImageMap?.[sub] ?? null
        const productCount = productCountsBySubcategory?.[sub] ?? 0
        return (
          <Card
            key={sub}
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden shrink-0 w-[220px]"
            onClick={() => onSelect(sub)}
          >
            <CardContent className="p-0 relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onUnpin(sub)
                }}
                className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-md bg-black/50 text-white hover:bg-black/70"
                title={t("unpinSubcategory")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {imageUrl ? (
                <div className="relative h-[120px]">
                  <Image
                    src={imageUrl}
                    alt={translateCat(sub)}
                    fill
                    className="object-cover"
                    sizes="220px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <h3 className="font-semibold text-sm text-white">{translateCat(sub)}</h3>
                    <p className="text-xs text-white/80">
                      {productCount} {t("productsLabel")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center h-[120px] flex flex-col items-center justify-center">
                  <Package className="h-8 w-8 mx-auto text-primary" />
                  <h3 className="mt-2 font-semibold text-sm">{translateCat(sub)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {productCount} {t("productsLabel")}
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
