import { Package, FileText, DollarSign, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDualPrice } from "@/lib/utils"
import { getSellerDashboardStats } from "@/lib/actions/orders"
import { getSellerProducts } from "@/lib/actions/products"
import { getTranslations } from "next-intl/server"

export default async function SellerDashboardPage() {
  const [stats, products, t, tCommon] = await Promise.all([
    getSellerDashboardStats(),
    getSellerProducts(),
    getTranslations("sellerDashboard"),
    getTranslations("common"),
  ])

  const topProducts = products.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t("totalProducts")} value={stats?.totalProducts ?? 0} icon={Package} />
        <StatCard title={t("activeOrders")} value={stats?.activeOrders ?? 0} icon={FileText} />
        <StatCard title={t("revenue")} value={formatCurrency(stats?.totalRevenue ?? 0)} icon={DollarSign} />
        <StatCard title={t("growth")} value="—" icon={TrendingUp} />
      </div>
      <Card>
        <CardHeader><CardTitle>{t("topProducts")}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topProducts.length > 0 ? topProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.model_number}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatDualPrice(p.price_per_meter, p.price_cny, p.pricing_type)}</p>
                  <p className="text-xs text-muted-foreground">{t("stock")}: {p.stock}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t("noProducts")}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
