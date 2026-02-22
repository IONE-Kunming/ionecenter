"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ArrowLeftRight, ArrowDownCircle, ArrowUpCircle, Download, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Transaction } from "@/lib/actions/finance"

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  pending: "secondary",
  draft: "outline",
}

const typeOptions = [
  { value: "", labelKey: "allTypes" as const },
  { value: "sale", labelKey: "sale" as const },
  { value: "expense", labelKey: "expense" as const },
  { value: "refund", labelKey: "refund" as const },
]

const statusOptions = [
  { value: "", labelKey: "allStatuses" as const },
  { value: "completed", labelKey: "completed" as const },
  { value: "pending", labelKey: "pending" as const },
  { value: "draft", labelKey: "draft" as const },
]

function escapeCSV(value: string | number): string {
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function exportCSV(transactions: Transaction[]) {
  const header = "Date,Reference,Description,Account,Debit,Credit,Status\n"
  const rows = transactions
    .map((t) => [t.date, t.reference, t.description, t.account, t.debit, t.credit, t.status].map(escapeCSV).join(","))
    .join("\n")
  const blob = new Blob([header + rows], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "transactions.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export function TransactionsList({ transactions }: { transactions: Transaction[] }) {
  const t = useTranslations("finance")
  const tCommon = useTranslations("common")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const filtered = transactions.filter((t) => {
    if (search && !t.description.toLowerCase().includes(search.toLowerCase()) && !t.reference.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter && t.type !== typeFilter) return false
    if (statusFilter && t.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ArrowLeftRight className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("transactions")}</h1>
          <p className="text-muted-foreground">View and manage your transaction history</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)}>
              <Download className="h-4 w-4" />
              {t("exportCsv")}
            </Button>
          </div>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchTransactions")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select aria-label="Filter by type" options={typeOptions.map(o => ({ value: o.value, label: o.labelKey === "allTypes" ? tCommon(o.labelKey) : t(o.labelKey) }))} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full sm:w-40" />
            <Select aria-label="Filter by status" options={statusOptions.map(o => ({ value: o.value, label: tCommon(o.labelKey) }))} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">{tCommon("date")}</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">{t("reference")}</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Description</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Account</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Debit</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Credit</th>
                  <th className="pb-3 font-medium text-muted-foreground">{tCommon("status")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">{t("noTransactions")}</td>
                  </tr>
                ) : (
                  filtered.map((txn) => (
                    <tr key={txn.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 text-muted-foreground">{formatDate(txn.date)}</td>
                      <td className="py-3 pr-4 font-mono text-xs">{txn.reference}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          {txn.credit > 0 ? (
                            <ArrowDownCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowUpCircle className="h-4 w-4 text-red-500" />
                          )}
                          {txn.description}
                        </div>
                      </td>
                      <td className="py-3 pr-4">{txn.account}</td>
                      <td className="py-3 pr-4 text-right font-medium text-red-600">
                        {txn.debit > 0 ? formatCurrency(txn.debit) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-right font-medium text-green-600">
                        {txn.credit > 0 ? formatCurrency(txn.credit) : "—"}
                      </td>
                      <td className="py-3">
                        <Badge variant={statusVariant[txn.status] ?? "outline"}>
                          {txn.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
