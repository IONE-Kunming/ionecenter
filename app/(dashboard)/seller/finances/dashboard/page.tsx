import { DollarSign, TrendingUp, CreditCard, AlertCircle, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"

const recentActivity = [
  { id: 1, description: "Payment received from Order #1042", amount: 2450.0, date: "2024-12-15", type: "credit" },
  { id: 2, description: "Platform fee deduction", amount: -122.5, date: "2024-12-14", type: "debit" },
  { id: 3, description: "Refund issued for Order #1038", amount: -180.0, date: "2024-12-13", type: "debit" },
  { id: 4, description: "Payment received from Order #1039", amount: 1875.0, date: "2024-12-12", type: "credit" },
  { id: 5, description: "Withdrawal to bank account", amount: -3000.0, date: "2024-12-11", type: "debit" },
]

export default function FinancesDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Dashboard</h1>
          <p className="text-muted-foreground">Overview of your financial activity</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(48250.0)}
          icon={DollarSign}
          trend={{ value: 12.5, label: "from last month" }}
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(5320.0)}
          icon={CreditCard}
          trend={{ value: -3.2, label: "from last month" }}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(8450.0)}
          icon={TrendingUp}
          trend={{ value: 8.1, label: "from last month" }}
        />
        <StatCard
          title="Pending Payments"
          value={formatCurrency(2150.0)}
          icon={AlertCircle}
          trend={{ value: -15.3, label: "from last month" }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Financial Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{item.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.type === "credit" ? "default" : "secondary"}>
                    {item.type}
                  </Badge>
                  <span className={`text-sm font-semibold ${item.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {item.amount >= 0 ? "+" : ""}{formatCurrency(Math.abs(item.amount))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
