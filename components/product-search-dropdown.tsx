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
  className?: string
}

const MAX_DROPDOWN_ITEMS = 8

export function ProductSearchDropdown({
  value,
  onChange,
  products,
  placeholder = "Search products...",
  linkPrefix,
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
    const q = value.toLowerCase()
    return products
      .filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.model_number.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
        )
      })
      .slice(0, MAX_DROPDOWN_ITEMS)
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
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-md border bg-popover shadow-lg">
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
                  onClick={() => setIsFocused(false)}
                >
                  {content}
                </Link>
              )
            }

            return (
              <div key={product.id} onClick={() => setIsFocused(false)}>
                {content}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
