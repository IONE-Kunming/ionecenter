"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import Image from "next/image"
import { Search, Package } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"

export interface SearchableProduct {
  id: string
  name: string
  model_number: string
  main_category: string
  category: string
  description?: string | null
  image_url: string | null
}

interface ProductSearchDropdownProps {
  products: SearchableProduct[]
  search: string
  onSearchChange: (value: string) => void
  onSelect: (product: SearchableProduct) => void
  placeholder?: string
  className?: string
  maxResults?: number
}

export function ProductSearchDropdown({
  products,
  search,
  onSearchChange,
  onSelect,
  placeholder,
  className,
  maxResults = 20,
}: ProductSearchDropdownProps) {
  const tCommon = useTranslations("common")
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const dropdownResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.model_number.toLowerCase().includes(q) ||
        p.main_category.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    )
  }, [products, search])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => {
          onSearchChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => { if (search.trim()) setOpen(true) }}
        placeholder={placeholder ?? tCommon("searchProducts")}
        className="pl-9"
      />
      {open && search.trim() && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-md border bg-popover shadow-lg">
          {dropdownResults.length > 0 ? (
            dropdownResults.slice(0, maxResults).map((product) => (
              <button
                key={product.id}
                type="button"
                className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                onClick={() => {
                  onSelect(product)
                  setOpen(false)
                }}
              >
                <div className="h-10 w-10 flex-shrink-0 relative rounded bg-muted flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="40px"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{product.model_number}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              {tCommon("noResults")}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
