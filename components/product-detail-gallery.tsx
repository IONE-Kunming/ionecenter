"use client"

import { useState } from "react"
import Image from "next/image"
import { Package } from "lucide-react"

interface ProductDetailGalleryProps {
  images: { image_url: string; is_primary: boolean }[]
  fallbackUrl: string | null
  alt: string
}

export function ProductDetailGallery({ images, fallbackUrl, alt }: ProductDetailGalleryProps) {
  // Build display list: use images from product_images if available, else fallback
  const imageUrls = images.length > 0
    ? images.map((img) => img.image_url)
    : fallbackUrl
      ? [fallbackUrl]
      : []

  const [selectedIndex, setSelectedIndex] = useState(0)

  if (imageUrls.length === 0) {
    return (
      <div className="aspect-square relative bg-white rounded-xl flex items-center justify-center overflow-hidden">
        <Package className="h-24 w-24 text-muted-foreground/20" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-square relative bg-white rounded-xl flex items-center justify-center overflow-hidden">
        <Image
          src={imageUrls[selectedIndex]}
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails (only shown if more than 1 image) */}
      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imageUrls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === selectedIndex ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={url}
                alt={`${alt} - ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
