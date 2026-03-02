import { Landmark, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, getIntlLocale } from "@/lib/utils"
import { getLocale } from "next-intl/server"

const accountCategories = [
  {
    name: "Assets",
    icon: Wallet,
    color: "bg-blue-500",
    accounts: [
      { name: "Cash & Bank", balance: 24500.0 },
      { name: "Accounts Receivable", balance: 8750.0 },
      { name: "Inventory", balance: 15200.0 },
    ],
  },
  {
    name: "Liabilities",
    icon: TrendingDown,
    color: "bg-red-500",
    accounts: [
      { name: "Accounts Payable", balance: 6300.0 },
      { name: "Accrued Expenses", balance: 1250.0 },
      { name: "Loans Payable", balance: 10000.0 },
    ],
  },
  {
    name: "Revenue",
    icon: TrendingUp,
    color: "bg-green-500",
    accounts: [
      { name: "Product Sales", balance: 48250.0 },
      { name: "Service Income", balance: 5400.0 },
      { name: "Other Income", balance: 820.0 },
    ],
  },
  {
    name: "Expenses",
    icon: TrendingDown,
    color: "bg-orange-500",
    accounts: [
      { name: "Cost of Goods Sold", balance: 22100.0 },
      { name: "Operating Expenses", balance: 8900.0 },
      { name: "Platform Fees", balance: 2415.0 },
    ],
  },
]

export default async function AccountsPage() {
  const locale = await getLocale()
  const intlLocale = getIntlLocale(locale)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Landmark className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
          <p className="text-muted-foreground">Manage your financial accounts and balances</p>
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
                  <span className="text-lg">{formatCurrency(total, "USD", intlLocale)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.accounts.map((account) => (
                    <div key={account.name} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <span className="text-sm text-muted-foreground">{account.name}</span>
                      <span className="text-sm font-medium">{formatCurrency(account.balance, "USD", intlLocale)}</span>
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
