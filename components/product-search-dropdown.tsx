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
  category: string
  description?: string | null
  image_url: string | null
}

interface ProductSearchDropdownProps {
  products: SearchableProduct[]
  value: string
  onChange: (value: string) => void
  onSelect: (productId: string) => void
  placeholder?: string
  className?: string
  maxResults?: number
}

export function ProductSearchDropdown({
  products,
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  maxResults = 8,
}: ProductSearchDropdownProps) {
  const t = useTranslations("common")
  const tCatalog = useTranslations("catalog")
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    if (!value.trim()) return []
    const q = value.toLowerCase()
    return products.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.model_number.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      )
    })
  }, [products, value])

  const visibleMatches = matches.slice(0, maxResults)

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
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => { if (value.trim()) setOpen(true) }}
        placeholder={placeholder ?? t("searchProducts")}
        className="pl-9"
      />
      {open && value.trim() && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-80 overflow-y-auto rounded-lg border bg-popover shadow-lg">
          {visibleMatches.length > 0 ? (
            visibleMatches.map((product) => (
              <button
                key={product.id}
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect(product.id)
                  setOpen(false)
                }}
              >
                <div className="h-10 w-10 shrink-0 rounded border bg-card flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="object-contain"
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
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              {tCatalog("noProducts")}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
