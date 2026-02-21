import { Package, FileText, DollarSign, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

export default function SellerDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={24} icon={Package} />
        <StatCard title="Active Orders" value={8} icon={FileText} />
        <StatCard title="Revenue" value={formatCurrency(45200)} icon={DollarSign} />
        <StatCard title="Growth" value="+12.5%" icon={TrendingUp} />
      </div>
      <Card>
        <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Premium Window Profile", model: "WP-6063-T5", orders: 45, revenue: 12500 },
              { name: "Industrial T-Slot Profile", model: "TS-4040-V2", orders: 38, revenue: 9500 },
              { name: "Curtain Wall Section", model: "CW-100-A", orders: 22, revenue: 15400 },
            ].map((p) => (
              <div key={p.model} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.model}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(p.revenue)}</p>
                  <p className="text-xs text-muted-foreground">{p.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
