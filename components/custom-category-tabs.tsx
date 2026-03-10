"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

export type CustomCategoryTab = "all" | "empty" | string

interface CustomCategoryTabsProps {
  products: { custom_category?: string | null }[]
  activeTab: CustomCategoryTab
  onTabChange: (tab: CustomCategoryTab) => void
  className?: string
}

/**
 * Dynamic tabs bar that shows "All", "Empty", and one tab per unique custom_category value.
 * Derives tabs from the current product list so new categories appear automatically.
 */
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
    <div className={cn("flex items-center gap-2 overflow-x-auto py-2 px-1", className)}>
      {/* Default tabs */}
      <TabButton active={activeTab === "all"} onClick={() => onTabChange("all")}>
        All
      </TabButton>
      <TabButton active={activeTab === "empty"} onClick={() => onTabChange("empty")}>
        Empty
      </TabButton>
      {/* Dynamic custom category tabs */}
      {categoryTabs.map((cat) => (
        <TabButton key={cat} active={activeTab === cat} onClick={() => onTabChange(cat)}>
          {cat}
        </TabButton>
      ))}
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
      )}
    >
      {children}
    </button>
  )
}

/** Filter products by the active custom category tab */
export function filterByCustomCategoryTab<T extends { custom_category?: string | null }>(
  products: T[],
  tab: CustomCategoryTab
): T[] {
  if (tab === "all") return products
  if (tab === "empty") return products.filter((p) => !p.custom_category || p.custom_category.trim() === "")
  return products.filter((p) => p.custom_category?.trim() === tab)
}
