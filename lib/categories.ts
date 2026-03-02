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
  /** Map of category/subcategory name → image URL (from Supabase) */
  categoryImageMap: Record<string, string | null>
}

/**
 * Converts flat SiteCategory[] rows from Supabase into a CategoryData structure.
 */
export function buildCategoryData(siteCategories: SiteCategory[]): CategoryData {
  const mainCats = siteCategories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.name.localeCompare(b.name))

  const categoryMap: Record<string, string[]> = {}
  const categoryImageMap: Record<string, string | null> = {}

  for (const main of mainCats) {
    categoryImageMap[main.name] = main.image_url
    const subs = siteCategories
      .filter((c) => c.parent_id === main.id)
      .sort((a, b) => a.name.localeCompare(b.name))
    categoryMap[main.name] = subs.map((c) => c.name)
    for (const sub of subs) {
      categoryImageMap[sub.name] = sub.image_url
    }
  }

  return {
    mainCategories: mainCats.map((c) => c.name),
    categoryMap,
    categoryImageMap,
  }
}

// ─── Translation helpers ─────────────────────────────────────────────────────

/**
 * Convert an English category name to a camelCase translation key matching the
 * `categoryNames` namespace in the messages JSON files.
 *
 * Examples:
 *   "Construction"              → "construction"
 *   "Exterior Gates"            → "exteriorGates"
 *   "Apparel & Accessories"     → "apparelAccessories"
 *   "Men's Clothing"            → "mensClothing"
 *   "Eco-friendly Products"     → "ecofriendlyProducts"
 *   "Gifts, Sports & Toys"      → "giftsSportsToys"
 */
export function toCategoryKey(name: string): string {
  const normalized = name
    .replace(/['\-]/g, "")   // remove apostrophes and hyphens (no word break)
    .replace(/[&,]/g, " ")    // treat & and , as word separators
    .replace(/\s+/g, " ")     // normalize whitespace
    .trim()

  const words = normalized.split(" ").filter(Boolean)
  return words
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("")
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
