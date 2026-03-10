"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import Image from "next/image"
import { Search, Package } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "@/components/ui/link"

interface SearchableProduct {
  id: string
  name: string
  model_number: string
  category: string
  description?: string | null
  image_url?: string | null
}

interface ProductSearchDropdownProps {
  value: string
  onChange: (value: string) => void
  products: SearchableProduct[]
  placeholder?: string
  /** URL prefix for product links, e.g. "/buyer/product" */
  linkPrefix?: string
  /** Callback when a product item is clicked (used instead of linkPrefix when provided) */
  onItemClick?: (productId: string) => void
  className?: string
}

const MAX_DROPDOWN_ITEMS = 8

/** Check whether a product matches a search query across name, model_number, category, and description. */
export function matchesProductSearch(product: SearchableProduct, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    product.name.toLowerCase().includes(q) ||
    product.model_number.toLowerCase().includes(q) ||
    product.category.toLowerCase().includes(q) ||
    (product.description != null && product.description.toLowerCase().includes(q))
  )
}

export function ProductSearchDropdown({
  value,
  onChange,
  products,
  placeholder = "Search products...",
  linkPrefix,
  onItemClick,
  className,
}: ProductSearchDropdownProps) {
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const dropdownItems = useMemo(() => {
    if (!value.trim()) return []
    return products.filter((p) => matchesProductSearch(p, value)).slice(0, MAX_DROPDOWN_ITEMS)
  }, [products, value])

  const showDropdown = isFocused && value.trim().length > 0 && dropdownItems.length > 0

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        placeholder={placeholder}
        className="pl-9"
      />
      {showDropdown && (
        <div role="listbox" className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-md border bg-popover shadow-lg">
          {dropdownItems.map((product) => {
            const content = (
              <div className="flex items-center gap-3 px-3 py-2 hover:bg-accent cursor-pointer transition-colors">
                <div className="h-10 w-10 flex-shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {product.model_number} · {product.category}
                  </p>
                </div>
              </div>
            )

            if (linkPrefix) {
              return (
                <Link
                  key={product.id}
                  href={`${linkPrefix}/${product.id}`}
                  role="option"
                  onClick={() => setIsFocused(false)}
                >
                  {content}
                </Link>
              )
            }

            return (
              <button
                key={product.id}
                type="button"
                role="option"
                className="w-full text-left"
                onClick={() => {
                  setIsFocused(false)
                  onItemClick?.(product.id)
                }}
              >
                {content}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
