"use client"

import { useState, useTransition } from "react"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { toggleWishlist } from "@/lib/actions/wishlist"
import { useTranslations } from "next-intl"

interface WishlistButtonProps {
  productId: string
  initialLiked: boolean
  size?: "sm" | "md"
  onToggle?: (liked: boolean) => void
}

export function WishlistButton({ productId, initialLiked, size = "sm", onToggle }: WishlistButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [animate, setAnimate] = useState(false)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations("wishlist")

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const newLiked = !liked
    setLiked(newLiked)
    setAnimate(true)
    setTimeout(() => setAnimate(false), 300)

    startTransition(async () => {
      try {
        const result = await toggleWishlist(productId)
        if (result.error) {
          console.error("Wishlist toggle error:", result.error)
          // Revert on error
          setLiked(!newLiked)
        } else {
          setLiked(result.liked)
          onToggle?.(result.liked)
        }
      } catch (err) {
        console.error("Wishlist toggle unexpected error:", err)
        // Revert on unexpected error
        setLiked(!newLiked)
      }
    })
  }

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
  const btnSize = size === "sm" ? "h-7 w-7" : "h-8 w-8"

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gray-900/80 dark:bg-gray-800/90 transition-all",
        btnSize,
        animate && "scale-125",
        "hover:bg-gray-900 dark:hover:bg-gray-700"
      )}
      aria-label={liked ? t("removeFromList") : t("addToList")}
    >
      <Heart
        className={cn(
          iconSize,
          "transition-colors",
          liked ? "fill-red-500 text-red-500" : "text-white"
        )}
      />
    </button>
  )
}
