"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ShoppingBag, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { setUserRole } from "@/lib/actions/roles"
import type { UserRole } from "@/types/database"
import { useTranslations } from "next-intl"

function SelectRoleContent() {
  const [selected, setSelected] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations("selectRole")
  const searchParams = useSearchParams()

  // Auto-select seller if coming from "Become a Seller" flow
  useEffect(() => {
    const intent = searchParams.get("intent")
    if (intent === "seller") {
      setSelected("seller")
    }
  }, [searchParams])

  async function handleContinue() {
    if (!selected) return
    setLoading(true)
    setError(null)
    const result = await setUserRole(selected)
    if (result.success) {
      if (selected === "seller") {
        window.location.href = "/seller/dashboard"
      } else {
        window.location.href = "/"
      }
    } else {
      setError(result.error ?? "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
            IC
          </div>
          <h1 className="mt-4 text-2xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              selected === "buyer"
                ? "ring-2 ring-primary shadow-md"
                : "hover:-translate-y-1"
            }`}
            onClick={() => setSelected("buyer")}
          >
            <CardContent className="p-6 text-center">
              <ShoppingBag className="h-10 w-10 mx-auto text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{t("buyer")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("buyerDesc")}
              </p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              selected === "seller"
                ? "ring-2 ring-primary shadow-md"
                : "hover:-translate-y-1"
            }`}
            onClick={() => setSelected("seller")}
          >
            <CardContent className="p-6 text-center">
              <Store className="h-10 w-10 mx-auto text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{t("seller")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("sellerDesc")}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="mt-6 text-center">
          {error && (
            <p className="mb-3 text-sm text-destructive">{error}</p>
          )}
          <Button
            size="lg"
            disabled={!selected || loading}
            onClick={handleContinue}
            className="w-full sm:w-auto"
          >
            {loading ? t("loading") : t("continue")}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SelectRolePage() {
  return (
    <Suspense>
      <SelectRoleContent />
    </Suspense>
  )
}
