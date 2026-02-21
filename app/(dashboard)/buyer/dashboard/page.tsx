import { ShoppingCart, FileText, DollarSign, Package } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

export default function BuyerDashboardPage() {
  // In production, fetch from Supabase
  const stats = {
    totalOrders: 12,
    totalSpending: 15750.00,
    pendingOrders: 3,
    activeProducts: 45,
  }

  const recentOrders = [
    { id: "ORD-001", date: "2025-01-15", total: 2750.00, status: "processing" },
    { id: "ORD-002", date: "2025-01-12", total: 1430.00, status: "delivered" },
    { id: "ORD-003", date: "2025-01-10", total: 875.00, status: "pending" },
    { id: "ORD-004", date: "2025-01-08", total: 3200.00, status: "shipped" },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Orders" value={stats.totalOrders} icon={FileText} />
        <StatCard title="Total Spending" value={formatCurrency(stats.totalSpending)} icon={DollarSign} />
        <StatCard title="Pending Orders" value={stats.pendingOrders} icon={ShoppingCart} />
        <StatCard title="Products Browsed" value={stats.activeProducts} icon={Package} />
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{order.id}</p>
                  <p className="text-sm text-muted-foreground">{order.date}</p>
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
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
