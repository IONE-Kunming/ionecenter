import { Users, Package, FileText, DollarSign } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getAdminDashboardStats, getAllOrders } from "@/lib/actions/admin"
import { getTranslations } from "next-intl/server"

export default async function AdminDashboardPage() {
  const [stats, orders, t] = await Promise.all([
    getAdminDashboardStats(),
    getAllOrders(),
    getTranslations("adminDashboard"),
  ])

  const recentOrders = orders.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t("totalUsers")} value={stats?.totalUsers ?? 0} icon={Users} />
        <StatCard title={t("totalProducts")} value={stats?.totalProducts ?? 0} icon={Package} />
        <StatCard title={t("totalOrders")} value={stats?.totalOrders ?? 0} icon={FileText} />
        <StatCard title={t("totalRevenue")} value={formatCurrency(stats?.totalRevenue ?? 0)} icon={DollarSign} />
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recentOrders")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentOrders.length > 0 ? recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{order.id.slice(0, 8)}...</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatCurrency(order.total)}</span>
                  <Badge variant={
                    order.status === "delivered" ? "success" :
                    order.status === "pending" ? "warning" : "default"
                  }>
                    {order.status}
                  </Badge>
                  <Badge variant={
                    order.payment_status === "paid" ? "success" :
                    order.payment_status === "deposit_paid" ? "warning" : "default"
                  }>
                    {order.payment_status}
                  </Badge>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t("noOrders")}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
