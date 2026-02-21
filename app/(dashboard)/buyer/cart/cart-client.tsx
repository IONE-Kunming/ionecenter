"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ShoppingCart, Trash2, Minus, Plus, Package } from "lucide-react"
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
}

export default function CartClient({ items: initialItems }: { items: EnrichedCartItem[] }) {
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

  const removeItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id)
    setItems(updated)
    persistCart(updated)
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const { tax, total } = calculateOrderTotals(subtotal)

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Browse our catalog to find products."
        action={{ label: "Browse Catalog", onClick: () => window.location.href = "/buyer/catalog" }}
      />
    )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="h-20 w-20 bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center shrink-0">
                  <Package className="h-8 w-8 text-muted-foreground/30" />
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
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
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

      <div>
        <Card>
          <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (10%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <Link href="/buyer/checkout" className="block">
              <Button className="w-full mt-4">Proceed to Checkout</Button>
            </Link>
            <Link href="/buyer/catalog" className="block">
              <Button variant="outline" className="w-full">Continue Shopping</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
