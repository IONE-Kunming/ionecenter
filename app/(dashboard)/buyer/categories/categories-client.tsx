"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Link from "@/components/ui/link"
import Image from "next/image"
import { Package } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { CategoryData } from "@/lib/categories"
import { toCategoryKey } from "@/lib/categories"

const CATEGORY_BADGE_ABSOLUTE =
  "absolute top-2 left-2 z-10 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md text-xs"

export function BuyerCategoriesClient({
  categoryData,
}: {
  categoryData: CategoryData
}) {
  const t = useTranslations("catalog")
  const tCat = useTranslations("categories")
  const tCatNames = useTranslations("categoryNames")
  const [showCategoryNumbers, setShowCategoryNumbers] = useState(true)

  const translateCat = (name: string): string => {
    const key = toCategoryKey(name)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translated = (tCatNames as any)(key)
    return typeof translated === "string" && translated !== key
      ? translated
      : name
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{tCat("title")}</h1>
        <p className="mt-2 text-muted-foreground">{tCat("subtitle")}</p>
      </div>

      <div className="flex justify-end items-center gap-2">
        <Label htmlFor="showNumbers" className="text-sm">
          {t("showNumbers")}
        </Label>
        <Switch
          id="showNumbers"
          checked={showCategoryNumbers}
          onCheckedChange={setShowCategoryNumbers}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryData.mainCategories.map((cat, catIdx) => {
          const subcategories = categoryData.categoryMap[cat] ?? []
          const categoryCode = String(catIdx + 1).padStart(2, "0")
          const imageUrl = categoryData.categoryImageMap[cat] ?? null

          return (
            <Link
              key={cat}
              href={`/buyer/categories/${encodeURIComponent(cat)}`}
            >
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden h-full">
                <CardContent className="p-0 relative">
                  {imageUrl ? (
                    <div className="relative h-[160px]">
                      {showCategoryNumbers && (
                        <div
                          className={CATEGORY_BADGE_ABSOLUTE}
                          aria-label={`Category ${categoryCode}`}
                        >
                          {categoryCode}
                        </div>
                      )}
                      <Image
                        src={imageUrl}
                        alt={translateCat(cat)}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="font-semibold text-white">
                          {translateCat(cat)}
                        </h3>
                        <p className="text-sm text-white/80">
                          {subcategories.length} {t("subcategories")}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center relative">
                      {showCategoryNumbers && (
                        <div
                          className={CATEGORY_BADGE_ABSOLUTE}
                          aria-label={`Category ${categoryCode}`}
                        >
                          {categoryCode}
                        </div>
                      )}
                      <Package className="h-10 w-10 mx-auto text-primary" />
                      <h3 className="mt-4 font-semibold text-base">
                        {translateCat(cat)}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {subcategories.length} {t("subcategories")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
