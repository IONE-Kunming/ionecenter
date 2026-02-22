"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { CreditCard, Building, Smartphone, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency, calculateOrderTotals, DEPOSIT_OPTIONS } from "@/lib/utils"
import { createOrdersFromCart } from "@/lib/actions/orders"
import type { CartItem, PaymentMethod } from "@/types/database"

const paymentMethodKeys = [
  { id: "alipay" as const, key: "alipay", icon: Smartphone },
  { id: "wechat" as const, key: "wechat", icon: Wallet },
  { id: "bank_transfer" as const, key: "bankTransfer", icon: Building },
  { id: "card" as const, key: "card", icon: CreditCard },
] as const

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
  const t = useTranslations("checkout")
  const tCart = useTranslations("cart")
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
        <CardHeader><CardTitle>{tCart("orderSummary")}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {enrichedItems.map((item) => (
            <div key={item.product_id} className="flex justify-between">
              <span className="text-muted-foreground">
                {item.name} {item.model_number && `(${item.model_number})`} × {item.quantity}
              </span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between"><span className="text-muted-foreground">{tCart("subtotal")}</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{tCart("tax10")}</span><span>{formatCurrency(tax)}</span></div>
          <div className="border-t pt-2 flex justify-between font-semibold text-base"><span>{tCart("total")}</span><span>{formatCurrency(total)}</span></div>
        </CardContent>
      </Card>

      {/* Deposit Selection */}
      <Card>
        <CardHeader><CardTitle>{t("selectDeposit")}</CardTitle></CardHeader>
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
              <div className="flex justify-between"><span>{t("depositAmount")}:</span><span className="font-medium">{formatCurrency(deposit)}</span></div>
              <div className="flex justify-between"><span>{t("remainingBalance")}:</span><span className="font-medium">{formatCurrency(remaining)}</span></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader><CardTitle>{t("paymentMethod")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethodKeys.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-2 p-4 transition-colors",
                  paymentMethod === method.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <method.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{t(method.key)}</span>
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
        {processing ? t("placingOrder") : depositPct ? `${t("placeOrder")} — ${formatCurrency(deposit)}` : t("selectDeposit")}
      </Button>
    </div>
  )
}
