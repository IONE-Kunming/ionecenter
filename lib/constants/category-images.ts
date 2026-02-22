/**
 * HD category images from Unsplash for product categories.
 * These are high-quality, freely licensed photos.
 * Format: https://images.unsplash.com/photo-{id}?w={width}&h={height}&fit=crop&auto=format&q=80
 */

export const CATEGORY_IMAGES: Record<string, string> = {
  "Construction":
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop&auto=format&q=80",
  "Apparel & Accessories":
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop&auto=format&q=80",
  "Automobiles & Motorcycles":
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop&auto=format&q=80",
  "Business Services":
    "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=600&fit=crop&auto=format&q=80",
  "Chemicals":
    "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop&auto=format&q=80",
  "Computer Products & Office Electronics":
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop&auto=format&q=80",
  "Consumer Electronics":
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop&auto=format&q=80",
  "Electrical Equipment & Supplies":
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop&auto=format&q=80",
  "Electronics Components & Supplies":
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop&auto=format&q=80",
  "Energy":
    "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop&auto=format&q=80",
  "Environment":
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop&auto=format&q=80",
  "Food & Beverage":
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop&auto=format&q=80",
  "Furniture":
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop&auto=format&q=80",
  "Gifts, Sports & Toys":
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&h=600&fit=crop&auto=format&q=80",
  "Hardware":
    "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&h=600&fit=crop&auto=format&q=80",
  "Health & Beauty":
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=600&fit=crop&auto=format&q=80",
  "Home & Garden":
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop&auto=format&q=80",
  "Home Appliances":
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&auto=format&q=80",
  "Industry Laser Equipment":
    "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&h=600&fit=crop&auto=format&q=80",
  "Lights & Lighting":
    "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&h=600&fit=crop&auto=format&q=80",
  "Luggage, Bags & Cases":
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop&auto=format&q=80",
  "Machinery":
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop&auto=format&q=80",
  "Measurement & Analysis Instruments":
    "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=800&h=600&fit=crop&auto=format&q=80",
  "Metallurgy, Mineral & Energy":
    "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&h=600&fit=crop&auto=format&q=80",
  "Packaging & Printing":
    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&h=600&fit=crop&auto=format&q=80",
  "Security & Protection":
    "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=600&fit=crop&auto=format&q=80",
  "Shoes & Accessories":
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop&auto=format&q=80",
  "Textiles & Leather Products":
    "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&h=600&fit=crop&auto=format&q=80",
  "Transportation":
    "https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=800&h=600&fit=crop&auto=format&q=80",
}

/**
 * Get the HD image URL for a category, with fallback
 */
export function getCategoryImage(categoryName: string): string | null {
  return CATEGORY_IMAGES[categoryName] || null
}
