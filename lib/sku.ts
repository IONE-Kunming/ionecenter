import { CATEGORIES, MAIN_CATEGORIES } from "@/types/categories"

const sortedMainCategories = [...MAIN_CATEGORIES].sort((a, b) =>
  a.localeCompare(b)
)

/**
 * Returns the 1-based alphabetical position of a main category.
 */
export function getCategoryIndex(mainCategory: string): number {
  const index = sortedMainCategories.indexOf(mainCategory)
  if (index === -1) return -1
  return index + 1
}

/**
 * Returns the 1-based alphabetical position of a subcategory within its parent category.
 */
export function getSubcategoryIndex(
  mainCategory: string,
  subcategory: string
): number {
  const category = CATEGORIES[mainCategory]
  if (!category) return -1
  const sorted = [...category.subcategories].sort((a, b) =>
    a.localeCompare(b)
  )
  const index = sorted.indexOf(subcategory)
  if (index === -1) return -1
  return index + 1
}

/**
 * Generates an IONE SKU code.
 * Format: "categoryIndex-subcategoryIndex-productIndex"
 */
export function generateSKU(
  mainCategory: string,
  subcategory: string,
  productIndex: number
): string {
  const catIdx = getCategoryIndex(mainCategory)
  const subIdx = getSubcategoryIndex(mainCategory, subcategory)
  return `${catIdx}-${subIdx}-${productIndex}`
}
