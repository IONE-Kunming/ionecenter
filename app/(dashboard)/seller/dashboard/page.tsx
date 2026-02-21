import { Package, FileText, DollarSign, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { getSellerDashboardStats } from "@/lib/actions/orders"
import { getSellerProducts } from "@/lib/actions/products"

export default async function SellerDashboardPage() {
  const [stats, products] = await Promise.all([
    getSellerDashboardStats(),
    getSellerProducts(),
  ])

  const topProducts = products.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={stats?.totalProducts ?? 0} icon={Package} />
        <StatCard title="Active Orders" value={stats?.activeOrders ?? 0} icon={FileText} />
        <StatCard title="Revenue" value={formatCurrency(stats?.totalRevenue ?? 0)} icon={DollarSign} />
        <StatCard title="Growth" value="—" icon={TrendingUp} />
      </div>
      <Card>
        <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topProducts.length > 0 ? topProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.model_number}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(p.price_per_meter)}/m</p>
                  <p className="text-xs text-muted-foreground">Stock: {p.stock}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">No products yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
