import Link from "@/components/ui/link"
import { CheckCircle, FileText, ShoppingCart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"

export default async function OrderConfirmationPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids } = await searchParams
  const t = await getTranslations("orderConfirmation")
  const orderIds = ids ? ids.split(",").filter(Boolean) : []

  return (
    <div className="max-w-lg mx-auto py-12 space-y-6 text-center">
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>

      {orderIds.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium">{t("orderIds")}</p>
            {orderIds.map((id) => (
              <Link
                key={id}
                href={`/buyer/orders/${id}`}
                className="block text-sm text-primary hover:underline font-mono"
              >
                {id}
              </Link>
            ))}
            {orderIds.length > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("multipleOrders", { count: orderIds.length })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">{t("mockPaymentNote")}</p>

      <div className="flex flex-col gap-3">
        <Link href="/buyer/orders">
          <Button className="w-full gap-2">
            <FileText className="h-4 w-4" />
            {t("viewOrders")}
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="w-full gap-2">
            <ShoppingCart className="h-4 w-4" />
            {t("continueShopping")}
          </Button>
        </Link>
      </div>
    </div>
  )
}
