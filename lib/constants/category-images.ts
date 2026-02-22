/**
 * HD category images from Unsplash for product categories.
 * These are high-quality, freely licensed photos.
 * Format: https://images.unsplash.com/photo-{id}?w={width}&h={height}&fit=crop&auto=format&q=80
 */

export const CATEGORY_IMAGES: Record<string, string> = {
  "Aluminum Profiles":
    "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&h=600&fit=crop&auto=format&q=80",
  "Aluminum Sheets":
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop&auto=format&q=80",
  "Glass Products":
    "https://images.unsplash.com/photo-1518005068251-37900150dfca?w=800&h=600&fit=crop&auto=format&q=80",
  "Hardware & Accessories":
    "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&h=600&fit=crop&auto=format&q=80",
  "Steel Products":
    "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&h=600&fit=crop&auto=format&q=80",
  "Insulation Materials":
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop&auto=format&q=80",
  "Tools & Equipment":
    "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&h=600&fit=crop&auto=format&q=80",
  "Raw Materials":
    "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&h=600&fit=crop&auto=format&q=80",
}

/**
 * Get the HD image URL for a category, with fallback
 */
export function getCategoryImage(categoryName: string): string | null {
  return CATEGORY_IMAGES[categoryName] || null
}
