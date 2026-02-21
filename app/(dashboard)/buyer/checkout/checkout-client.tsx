"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Building, Smartphone, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency, calculateOrderTotals, DEPOSIT_OPTIONS } from "@/lib/utils"
import { createOrdersFromCart } from "@/lib/actions/orders"
import type { CartItem, PaymentMethod } from "@/types/database"

const paymentMethods = [
  { id: "alipay" as const, label: "Alipay", icon: Smartphone },
  { id: "wechat" as const, label: "WeChat Pay", icon: Wallet },
  { id: "bank_transfer" as const, label: "Bank Transfer", icon: Building },
  { id: "card" as const, label: "Card Payment", icon: CreditCard },
]

interface EnrichedItem extends CartItem {
  name: string
  model_number: string
}

interface CheckoutClientProps {
  cartItems: CartItem[]
  subtotal: number
  enrichedItems: EnrichedItem[]
}

export default function CheckoutClient({ cartItems, subtotal, enrichedItems }: CheckoutClientProps) {
  const router = useRouter()
  const [depositPct, setDepositPct] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { tax, total } = calculateOrderTotals(subtotal)
  const deposit = depositPct ? total * (depositPct / 100) : 0
  const remaining = total - deposit

  const handleCheckout = async () => {
    if (!depositPct || !paymentMethod) return
    setProcessing(true)
    setError(null)
    const result = await createOrdersFromCart(cartItems, depositPct, paymentMethod)
    if (result.error) {
      setError(result.error)
      setProcessing(false)
    } else {
      router.push("/buyer/orders")
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {enrichedItems.map((item) => (
            <div key={item.product_id} className="flex justify-between">
              <span className="text-muted-foreground">
                {item.name} {item.model_number && `(${item.model_number})`} × {item.quantity}
              </span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax (10%)</span><span>{formatCurrency(tax)}</span></div>
          <div className="border-t pt-2 flex justify-between font-semibold text-base"><span>Total</span><span>{formatCurrency(total)}</span></div>
        </CardContent>
      </Card>

      {/* Deposit Selection */}
      <Card>
        <CardHeader><CardTitle>Select Deposit Amount</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DEPOSIT_OPTIONS.map((pct) => (
              <button
                key={pct}
                onClick={() => setDepositPct(pct)}
                className={cn(
                  "rounded-lg border-2 p-4 text-center transition-colors",
                  depositPct === pct ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <span className="text-2xl font-bold">{pct}%</span>
                <p className="text-xs text-muted-foreground mt-1">{formatCurrency(total * pct / 100)}</p>
              </button>
            ))}
          </div>
          {depositPct && (
            <div className="mt-4 p-3 rounded-lg bg-muted text-sm space-y-1">
              <div className="flex justify-between"><span>Deposit Amount:</span><span className="font-medium">{formatCurrency(deposit)}</span></div>
              <div className="flex justify-between"><span>Remaining Balance:</span><span className="font-medium">{formatCurrency(remaining)}</span></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader><CardTitle>Payment Method</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-2 p-4 transition-colors",
                  paymentMethod === method.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <method.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{method.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Confirm */}
      <Button
        className="w-full"
        size="lg"
        disabled={!depositPct || !paymentMethod || processing}
        onClick={handleCheckout}
      >
        {processing ? "Processing Payment..." : `Pay ${depositPct ? formatCurrency(deposit) : "Select deposit"}`}
      </Button>
    </div>
  )
}
