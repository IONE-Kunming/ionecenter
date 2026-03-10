"use client"

import { useMemo } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type CustomCategoryTab = "all" | "empty" | string

interface CustomCategoryTabsProps {
  products: { custom_category?: string | null }[]
  activeTab: CustomCategoryTab
  onTabChange: (tab: CustomCategoryTab) => void
  className?: string
}

export function CustomCategoryTabs({ products, activeTab, onTabChange, className }: CustomCategoryTabsProps) {
  const categoryTabs = useMemo(() => {
    const unique = new Set<string>()
    for (const p of products) {
      if (p.custom_category && p.custom_category.trim() !== "") {
        unique.add(p.custom_category.trim())
      }
    }
    return [...unique].sort((a, b) => a.localeCompare(b))
  }, [products])

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className={className}>
      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="empty">Empty</TabsTrigger>
        {categoryTabs.map((cat) => (
          <TabsTrigger key={cat} value={cat}>
            {cat}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

export function filterByCustomCategoryTab<T extends { custom_category?: string | null }>(
  products: T[],
  tab: CustomCategoryTab,
): T[] {
  if (tab === "all") return products
  if (tab === "empty") return products.filter((p) => !p.custom_category || p.custom_category.trim() === "")
  return products.filter((p) => p.custom_category?.trim() === tab)
}
