import { DollarSign, TrendingUp, CreditCard, Receipt } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { formatCurrency } from "@/lib/utils"
import { getBuyerDashboardStats } from "@/lib/actions/orders"
import { getTranslations } from "next-intl/server"

export default async function FinancesDashboardPage() {
  const stats = await getBuyerDashboardStats()
  const t = await getTranslations("finance")

  const revenue = stats?.totalSpending ?? 0
  const tax = revenue * 0.1
  const expenses = 0
  const profit = revenue - tax - expenses

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
          <p className="text-muted-foreground">{t("financeDashboardDesc")}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("totalSpending")}
          value={formatCurrency(revenue)}
          icon={DollarSign}
        />
        <StatCard
          title={t("tax10")}
          value={formatCurrency(tax)}
          icon={Receipt}
        />
        <StatCard
          title={t("totalExpenses")}
          value={formatCurrency(expenses)}
          icon={CreditCard}
        />
        <StatCard
          title={t("netSpending")}
          value={formatCurrency(profit)}
          icon={TrendingUp}
        />
      </div>
    </div>
  )
}
