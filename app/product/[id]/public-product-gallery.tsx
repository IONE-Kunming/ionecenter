"use client"

import { ProductDetailGallery } from "@/components/product-detail-gallery"

interface PublicProductGalleryProps {
  images: { image_url: string; is_primary: boolean }[]
  alt: string
  videoUrls?: string[]
}

export function PublicProductGallery({ images, alt, videoUrls = [] }: PublicProductGalleryProps) {
  return (
    <div className="space-y-3">
      <ProductDetailGallery
        images={images}
        alt={alt}
      />
      {videoUrls.length > 0 && (
        <div className="space-y-2">
          {videoUrls.map((url, i) => (
            <video
              key={i}
              src={url}
              controls
              className="w-full rounded-lg"
              preload="none"
            />
          ))}
        </div>
      )}
    </div>
  )
}
