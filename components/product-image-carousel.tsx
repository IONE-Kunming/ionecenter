"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Package } from "lucide-react"

interface ProductImageCarouselProps {
  images: { image_url: string }[]
  fallbackUrl: string | null
  alt: string
  sizes?: string
}

export function ProductImageCarousel({ images, fallbackUrl, alt, sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" }: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Build display list: use images from product_images if available, else fallback
  const imageUrls = images.length > 0
    ? images.map((img) => img.image_url)
    : fallbackUrl
      ? [fallbackUrl]
      : []

  const hasMultiple = imageUrls.length > 1

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const goPrev = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1))
  }, [imageUrls.length])

  const goNext = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1))
  }, [imageUrls.length])

  if (imageUrls.length === 0) {
    return <Package className="h-12 w-12 text-muted-foreground/30" />
  }

  return (
    <div className="relative w-full h-full">
      <Image
        src={imageUrls[currentIndex]}
        alt={alt}
        fill
        className="object-contain"
        sizes={sizes}
      />
      {hasMultiple && (
        <>
          {/* Left arrow */}
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {/* Right arrow */}
          <button
            type="button"
            onClick={goNext}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
            {imageUrls.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo(i) }}
                className={`h-1.5 rounded-full transition-all ${i === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
