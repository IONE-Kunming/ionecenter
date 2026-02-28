"use client"

import { useState, useTransition, useMemo } from "react"
import { useTranslations } from "next-intl"
import Link from "@/components/ui/link"
import Image from "next/image"
import { ShoppingCart, Trash2, Minus, Plus, Package, Store } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, calculateOrderTotals } from "@/lib/utils"
import { updateCart } from "@/lib/actions/cart"

interface EnrichedCartItem {
  id: string
  name: string
  model_number: string
  price: number
  quantity: number
  stock: number
  image_url: string | null
  seller_id: string
}

interface SellerInfo {
  name: string
  company: string | null
}

export default function CartClient({ items: initialItems, sellerMap }: { items: EnrichedCartItem[]; sellerMap: Record<string, SellerInfo> }) {
  const t = useTranslations("cart")
  const [items, setItems] = useState<EnrichedCartItem[]>(initialItems)
  const [isPending, startTransition] = useTransition()

  const persistCart = (updated: EnrichedCartItem[]) => {
    startTransition(async () => {
      await updateCart(
        updated.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
        }))
      )
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    const updated = items.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, Math.min(item.stock, item.quantity + delta)) }
        : item
    )
    setItems(updated)
    persistCart(updated)
  }

  const setQuantity = (id: string, value: string) => {
    const parsed = parseInt(value, 10)
    if (isNaN(parsed) || parsed < 1) return
    const updated = items.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.min(item.stock, parsed) }
        : item
    )
    setItems(updated)
    persistCart(updated)
  }

  const removeItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id)
    setItems(updated)
    persistCart(updated)
  }

  // Group items by seller
  const groupedBySeller = useMemo(() => {
    const groups: Record<string, EnrichedCartItem[]> = {}
    for (const item of items) {
      const key = item.seller_id || "unknown"
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    }
    return groups
  }, [items])

  const overallSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const { tax: overallTax, total: overallTotal } = calculateOrderTotals(overallSubtotal)

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title={t("emptyCart")}
        description={t("emptyCartDesc")}
        action={{ label: t("browseCatalog"), onClick: () => window.location.href = "/buyer/catalog" }}
      />
    )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {Object.entries(groupedBySeller).map(([sellerId, sellerItems]) => {
          const seller = sellerMap[sellerId]
          const sellerSubtotal = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
          return (
            <div key={sellerId} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Store className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">
                  {seller?.company || seller?.name || "Unknown Seller"}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatCurrency(sellerSubtotal)}
                </span>
              </div>
              {sellerItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="h-20 w-20 relative bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.model_number}</p>
                        <p className="text-sm font-medium text-primary mt-1">{formatCurrency(item.price)}/m</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} disabled={isPending}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, -1)} disabled={isPending}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <input
                            type="number"
                            min={1}
                            max={item.stock}
                            value={item.quantity}
                            disabled={isPending}
                            className="w-12 text-center font-medium border rounded h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            onChange={(e) => setQuantity(item.id, e.target.value)}
                            onBlur={(e) => {
                              if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                                setQuantity(item.id, "1")
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "." || e.key === "-" || e.key === "e" || e.key === "+") {
                                e.preventDefault()
                              }
                            }}
                          />
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, 1)} disabled={isPending}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        })}
      </div>

      <div>
        <Card>
          <CardHeader><CardTitle>{t("orderSummary")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("subtotal")}</span>
              <span>{formatCurrency(overallSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("tax10")}</span>
              <span>{formatCurrency(overallTax)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>{t("total")}</span>
              <span>{formatCurrency(overallTotal)}</span>
            </div>
            {Object.keys(groupedBySeller).length > 1 && (
              <p className="text-xs text-muted-foreground">
                {Object.keys(groupedBySeller).length} separate orders will be created (one per seller)
              </p>
            )}
            <Link href="/buyer/checkout" className="block">
              <Button className="w-full mt-4">{t("proceedCheckout")}</Button>
            </Link>
            <Link href="/buyer/catalog" className="block">
              <Button variant="outline" className="w-full">{t("continueShopping")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
