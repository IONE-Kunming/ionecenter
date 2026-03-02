import { Scale, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, getIntlLocale } from "@/lib/utils"
import { getLocale } from "next-intl/server"

const matchedTransactions = [
  { id: "REC-001", date: "2024-12-15", description: "Payment received - Order #1042", bookAmount: 2450.0, bankAmount: 2450.0 },
  { id: "REC-002", date: "2024-12-14", description: "Platform fee deduction", bookAmount: -122.5, bankAmount: -122.5 },
  { id: "REC-003", date: "2024-12-12", description: "Payment received - Order #1039", bookAmount: 1875.0, bankAmount: 1875.0 },
  { id: "REC-004", date: "2024-12-11", description: "Bank withdrawal", bookAmount: -3000.0, bankAmount: -3000.0 },
]

const unmatchedTransactions = [
  { id: "REC-005", date: "2024-12-13", description: "Refund - Order #1038", bookAmount: -180.0, bankAmount: null, source: "books" },
  { id: "REC-006", date: "2024-12-10", description: "Unknown bank deposit", bookAmount: null, bankAmount: 75.0, source: "bank" },
  { id: "REC-007", date: "2024-12-09", description: "Service charge", bookAmount: null, bankAmount: -15.0, source: "bank" },
]

export default async function ReconciliationPage() {
  const locale = await getLocale()
  const intlLocale = getIntlLocale(locale)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Scale className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Reconciliation</h1>
          <p className="text-muted-foreground">Match your book records with bank statements</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Book Balance"
          value={formatCurrency(25322.5, "USD", intlLocale)}
          icon={CheckCircle2}
        />
        <StatCard
          title="Bank Balance"
          value={formatCurrency(25262.5, "USD", intlLocale)}
          icon={Scale}
        />
        <StatCard
          title="Difference"
          value={formatCurrency(60.0, "USD", intlLocale)}
          icon={AlertTriangle}
          trend={{ value: -2.1, label: "items to reconcile" }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Matched Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Date</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Description</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Book Amount</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Bank Amount</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {matchedTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 text-muted-foreground">{formatDate(txn.date, intlLocale)}</td>
                    <td className="py-3 pr-4">{txn.description}</td>
                    <td className="py-3 pr-4 text-right">{formatCurrency(Math.abs(txn.bookAmount), "USD", intlLocale)}</td>
                    <td className="py-3 pr-4 text-right">{formatCurrency(Math.abs(txn.bankAmount), "USD", intlLocale)}</td>
                    <td className="py-3">
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Matched
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Unmatched Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Date</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Description</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Book Amount</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Bank Amount</th>
                  <th className="pb-3 font-medium text-muted-foreground">Source</th>
                </tr>
              </thead>
              <tbody>
                {unmatchedTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 text-muted-foreground">{formatDate(txn.date, intlLocale)}</td>
                    <td className="py-3 pr-4">{txn.description}</td>
                    <td className="py-3 pr-4 text-right">
                      {txn.bookAmount !== null ? formatCurrency(Math.abs(txn.bookAmount), "USD", intlLocale) : "—"}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {txn.bankAmount !== null ? formatCurrency(Math.abs(txn.bankAmount), "USD", intlLocale) : "—"}
                    </td>
                    <td className="py-3">
                      <Badge variant="secondary">{txn.source}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
