import { ArrowLeftRight, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"

const transactions = [
  { id: "TXN-001", date: "2024-12-15", description: "Payment for Order #1042", type: "credit" as const, amount: 2450.0, status: "completed" },
  { id: "TXN-002", date: "2024-12-14", description: "Platform service fee", type: "debit" as const, amount: 122.5, status: "completed" },
  { id: "TXN-003", date: "2024-12-13", description: "Refund - Order #1038", type: "debit" as const, amount: 180.0, status: "completed" },
  { id: "TXN-004", date: "2024-12-12", description: "Payment for Order #1039", type: "credit" as const, amount: 1875.0, status: "completed" },
  { id: "TXN-005", date: "2024-12-11", description: "Bank withdrawal", type: "debit" as const, amount: 3000.0, status: "completed" },
  { id: "TXN-006", date: "2024-12-10", description: "Payment for Order #1035", type: "credit" as const, amount: 3200.0, status: "pending" },
  { id: "TXN-007", date: "2024-12-09", description: "Shipping fee reimbursement", type: "credit" as const, amount: 45.0, status: "completed" },
  { id: "TXN-008", date: "2024-12-08", description: "Monthly subscription fee", type: "debit" as const, amount: 29.99, status: "pending" },
]

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  pending: "secondary",
  failed: "destructive",
}

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ArrowLeftRight className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">View and manage your transaction history</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Date</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Description</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Type</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Amount</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 text-muted-foreground">{formatDate(txn.date)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {txn.type === "credit" ? (
                          <ArrowDownCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowUpCircle className="h-4 w-4 text-red-500" />
                        )}
                        {txn.description}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={txn.type === "credit" ? "default" : "secondary"}>
                        {txn.type}
                      </Badge>
                    </td>
                    <td className={`py-3 pr-4 text-right font-medium ${txn.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                      {txn.type === "credit" ? "+" : "-"}{formatCurrency(txn.amount)}
                    </td>
                    <td className="py-3">
                      <Badge variant={statusVariant[txn.status] ?? "outline"}>
                        {txn.status}
                      </Badge>
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
