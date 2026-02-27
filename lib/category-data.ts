import type { SiteCategory } from "@/lib/actions/site-settings"

/**
 * Structured category data derived from Supabase site_categories.
 * Passed as a prop to client components so they don't need hardcoded categories.
 */
export interface CategoryData {
  /** Ordered list of main category names */
  mainCategories: string[]
  /** Map of main category name → ordered subcategory names */
  subcategoryMap: Record<string, string[]>
}

/**
 * Build CategoryData from a flat SiteCategory[] array fetched from Supabase.
 */
export function buildCategoryData(allCategories: SiteCategory[]): CategoryData {
  const mains = allCategories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order)

  const subcategoryMap: Record<string, string[]> = {}
  for (const main of mains) {
    subcategoryMap[main.name] = allCategories
      .filter((c) => c.parent_id === main.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => c.name)
  }

  return {
    mainCategories: mains.map((c) => c.name),
    subcategoryMap,
  }
}

/** Get subcategories for a main category from CategoryData */
export function getSubcategoriesFromData(data: CategoryData, mainCategory: string): string[] {
  return data.subcategoryMap[mainCategory] ?? []
}

/** Check if a category name is a main category */
export function isMainCategoryInData(data: CategoryData, category: string): boolean {
  return data.mainCategories.includes(category)
}

/** Find the main category for a given subcategory (case-insensitive) */
export function getMainCategoryForSubcategoryFromData(data: CategoryData, subcategory: string): string | null {
  const lower = subcategory.toLowerCase()
  for (const [main, subs] of Object.entries(data.subcategoryMap)) {
    if (subs.some((s) => s.toLowerCase() === lower)) {
      return main
    }
  }
  return null
}
