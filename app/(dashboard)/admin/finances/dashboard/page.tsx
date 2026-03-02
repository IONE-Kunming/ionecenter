import { DollarSign, TrendingUp, CreditCard, Receipt } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { formatCurrency, getIntlLocale } from "@/lib/utils"
import { getAdminDashboardStats } from "@/lib/actions/admin"
import { getLocale } from "next-intl/server"

export default async function FinancesDashboardPage() {
  const [stats, locale] = await Promise.all([
    getAdminDashboardStats(),
    getLocale(),
  ])
  const intlLocale = getIntlLocale(locale)

  const revenue = stats?.totalRevenue ?? 0
  const tax = revenue * 0.1
  const expenses = 0
  const profit = revenue - tax - expenses

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Dashboard</h1>
          <p className="text-muted-foreground">Overview of platform financial activity</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenue"
          value={formatCurrency(revenue, "USD", intlLocale)}
          icon={DollarSign}
        />
        <StatCard
          title="Tax (10%)"
          value={formatCurrency(tax, "USD", intlLocale)}
          icon={Receipt}
        />
        <StatCard
          title="Expenses"
          value={formatCurrency(expenses, "USD", intlLocale)}
          icon={CreditCard}
        />
        <StatCard
          title="Profit"
          value={formatCurrency(profit, "USD", intlLocale)}
          icon={TrendingUp}
        />
      </div>
    </div>
  )
}
