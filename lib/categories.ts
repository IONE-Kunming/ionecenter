import type { SiteCategory } from "@/lib/actions/site-settings"

/**
 * Dynamic category data built from Supabase site_categories table.
 * Replaces the hardcoded CATEGORIES / MAIN_CATEGORIES from types/categories.ts.
 */
export interface CategoryData {
  /** Ordered list of main category names */
  mainCategories: string[]
  /** Map of main_category_name → subcategory names[] */
  categoryMap: Record<string, string[]>
}

/**
 * Converts flat SiteCategory[] rows from Supabase into a CategoryData structure.
 */
export function buildCategoryData(siteCategories: SiteCategory[]): CategoryData {
  const mainCats = siteCategories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))

  const categoryMap: Record<string, string[]> = {}
  for (const main of mainCats) {
    const subs = siteCategories
      .filter((c) => c.parent_id === main.id)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      .map((c) => c.name)
    categoryMap[main.name] = subs
  }

  return {
    mainCategories: mainCats.map((c) => c.name),
    categoryMap,
  }
}

// ─── Helper functions that operate on CategoryData ──────────────────────────

export function getSubcategoriesFromData(data: CategoryData, mainCategory: string): string[] {
  return data.categoryMap[mainCategory] ?? []
}

export function isMainCategoryInData(data: CategoryData, category: string): boolean {
  return category in data.categoryMap
}

export function getMainCategoryForSubcategoryInData(
  data: CategoryData,
  subcategory: string
): string | null {
  const lower = subcategory.toLowerCase()
  for (const [mainCategory, subs] of Object.entries(data.categoryMap)) {
    if (subs.some((s) => s.toLowerCase() === lower)) {
      return mainCategory
    }
  }
  return null
}
