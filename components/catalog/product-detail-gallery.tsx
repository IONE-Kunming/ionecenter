"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Package, PlayCircle } from "lucide-react"

interface MediaItem {
  type: "image" | "video"
  url: string
}

interface ProductDetailGalleryProps {
  media: MediaItem[]
  alt: string
}

export function ProductDetailGallery({ media, alt }: ProductDetailGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentMedia = media[currentIndex] ?? null

  return (
    <div className="space-y-3">
      <div className="aspect-square relative bg-white rounded-xl flex items-center justify-center overflow-hidden">
        {currentMedia?.type === "image" ? (
          <Image
            src={currentMedia.url}
            alt={alt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        ) : currentMedia?.type === "video" ? (
          <video
            src={currentMedia.url}
            controls
            className="w-full h-full object-contain"
            preload="none"
          />
        ) : (
          <Package className="h-24 w-24 text-muted-foreground/20" />
        )}
        {media.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((i) => (i - 1 + media.length) % media.length)}
              className="absolute start-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentIndex((i) => (i + 1) % media.length)}
              className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.map((m, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-colors ${i === currentIndex ? "border-primary" : "border-transparent"}`}
            >
              {m.type === "image" ? (
                <Image src={m.url} alt={`${alt} - Thumbnail ${i + 1}`} fill className="object-cover" sizes="64px" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <PlayCircle className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
