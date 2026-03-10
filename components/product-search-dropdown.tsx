"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import Image from "next/image"
import { Package, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchableProduct {
  id: string
  name: string
  model_number: string
  category: string
  main_category: string
  description?: string | null
  image_url?: string | null
}

interface ProductSearchDropdownProps {
  products: SearchableProduct[]
  search: string
  onSearchChange: (value: string) => void
  onSelect: (product: SearchableProduct) => void
  placeholder?: string
}

export function ProductSearchDropdown({
  products,
  search,
  onSearchChange,
  onSelect,
  placeholder = "Search products...",
}: ProductSearchDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const dropdownResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.model_number.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.main_category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    )
  }, [products, search])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative flex-1" ref={containerRef}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => {
          onSearchChange(e.target.value)
          setShowDropdown(e.target.value.trim().length > 0)
        }}
        onFocus={() => {
          if (search.trim().length > 0) setShowDropdown(true)
        }}
        placeholder={placeholder}
        className="pl-9"
      />
      {showDropdown && search.trim().length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-72 overflow-auto">
          {dropdownResults.length > 0 ? (
            dropdownResults.slice(0, 20).map((product) => (
              <button
                key={product.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-3"
                onClick={() => {
                  onSelect(product)
                  setShowDropdown(false)
                }}
              >
                <div className="w-10 h-10 relative flex-shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="40px"
                    />
                  ) : (
                    <Package className="h-4 w-4 text-muted-foreground/40" />
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
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
