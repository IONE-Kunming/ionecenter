import type { CategoryData } from "@/lib/categories"
import { getSubcategoriesFromData } from "@/lib/categories"

/**
 * Returns the 1-based alphabetical position of a main category.
 */
export function getCategoryIndex(categoryData: CategoryData, mainCategory: string): number {
  const sorted = [...categoryData.mainCategories].sort((a, b) => a.localeCompare(b))
  const index = sorted.indexOf(mainCategory)
  if (index === -1) return -1
  return index + 1
}

/**
 * Returns the 1-based alphabetical position of a subcategory within its parent category.
 */
export function getSubcategoryIndex(
  categoryData: CategoryData,
  mainCategory: string,
  subcategory: string
): number {
  const subs = getSubcategoriesFromData(categoryData, mainCategory)
  if (subs.length === 0) return -1
  const sorted = [...subs].sort((a, b) => a.localeCompare(b))
  const index = sorted.indexOf(subcategory)
  if (index === -1) return -1
  return index + 1
}

/**
 * Generates an IONE SKU code.
 * Format: "IONE-{categoryIndex}{subcategoryIndex}{productIndex}"
 * e.g. IONE-111 = product #1 in subcategory #1 under category #1
 */
export function generateSKU(
  categoryData: CategoryData,
  mainCategory: string,
  subcategory: string,
  productIndex: number
): string {
  const catIdx = getCategoryIndex(categoryData, mainCategory)
  const subIdx = getSubcategoryIndex(categoryData, mainCategory, subcategory)
  return `IONE-${catIdx}${subIdx}${productIndex}`
}
