"use client"

import { Landmark, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFormatters } from "@/lib/use-formatters"

export default function AccountsPage() {
  const t = useTranslations("finance")
  const { formatCurrency } = useFormatters()

  const accountCategories = [
    {
      name: t("assets"),
      icon: Wallet,
      color: "bg-blue-500",
      accounts: [
        { name: t("cash"), balance: 24500.0 },
        { name: t("receivables"), balance: 8750.0 },
        { name: t("inventory"), balance: 15200.0 },
      ],
    },
    {
      name: t("liabilities"),
      icon: TrendingDown,
      color: "bg-red-500",
      accounts: [
        { name: t("payable"), balance: 6300.0 },
        { name: t("accruedExpenses"), balance: 1250.0 },
        { name: t("loans"), balance: 10000.0 },
      ],
    },
    {
      name: t("revenue"),
      icon: TrendingUp,
      color: "bg-green-500",
      accounts: [
        { name: t("salesRevenue"), balance: 48250.0 },
        { name: t("serviceRevenue"), balance: 5400.0 },
        { name: t("otherIncome"), balance: 820.0 },
      ],
    },
    {
      name: t("expenses"),
      icon: TrendingDown,
      color: "bg-orange-500",
      accounts: [
        { name: t("cogs"), balance: 22100.0 },
        { name: t("operatingExpenses"), balance: 8900.0 },
        { name: t("fees"), balance: 2415.0 },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Landmark className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("chartOfAccounts")}</h1>
          <p className="text-muted-foreground">{t("chartOfAccountsDesc")}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {accountCategories.map((category) => {
          const CategoryIcon = category.icon
          const total = category.accounts.reduce((sum, acc) => sum + acc.balance, 0)

          return (
            <Card key={category.name}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${category.color}`} />
                    <CategoryIcon className="h-5 w-5" />
                    {category.name}
                  </div>
                  <span className="text-lg">{formatCurrency(total)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.accounts.map((account) => (
                    <div key={account.name} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <span className="text-sm text-muted-foreground">{account.name}</span>
                      <span className="text-sm font-medium">{formatCurrency(account.balance)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
