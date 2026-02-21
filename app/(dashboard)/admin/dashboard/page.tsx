import { Users, Package, FileText, DollarSign } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getAdminDashboardStats, getAllOrders } from "@/lib/actions/admin"

export default async function AdminDashboardPage() {
  const [stats, orders] = await Promise.all([
    getAdminDashboardStats(),
    getAllOrders(),
  ])

  const recentOrders = orders.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
        <StatCard title="Total Products" value={stats?.totalProducts ?? 0} icon={Package} />
        <StatCard title="Total Orders" value={stats?.totalOrders ?? 0} icon={FileText} />
        <StatCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue ?? 0)} icon={DollarSign} />
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
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
                    order.status === "pending" ? "warning" :
                    order.status === "cancelled" ? "destructive" : "default"
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
              <p className="text-sm text-muted-foreground text-center py-4">No orders yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
