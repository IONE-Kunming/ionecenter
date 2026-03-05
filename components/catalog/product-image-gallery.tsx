"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Package } from "lucide-react"

interface ProductImageGalleryProps {
  images: string[]
  alt: string
  sizes?: string
  /** Show navigation dots at the bottom */
  showDots?: boolean
  /** Show navigation arrows */
  showArrows?: boolean
  /** CSS class for the container */
  className?: string
}

export function ProductImageGallery({
  images,
  alt,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  showDots = true,
  showArrows = true,
  className = "",
}: ProductImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setCurrentIndex((i) => (i - 1 + images.length) % images.length)
    },
    [images.length]
  )

  const goToNext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setCurrentIndex((i) => (i + 1) % images.length)
    },
    [images.length]
  )

  const goToIndex = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault()
      e.stopPropagation()
      setCurrentIndex(index)
    },
    []
  )

  if (images.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Package className="h-12 w-12 text-muted-foreground/30" />
      </div>
    )
  }

  return (
    <div className={`relative group/gallery ${className}`}>
      <Image
        src={images[currentIndex]}
        alt={alt}
        fill
        className="object-cover transition-opacity duration-200"
        sizes={sizes}
      />

      {/* Navigation Arrows */}
      {showArrows && images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute start-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all opacity-0 group-hover/gallery:opacity-100"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute end-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all opacity-0 group-hover/gallery:opacity-100"
            aria-label="Next image"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => goToIndex(e, i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-white w-3"
                  : "bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
