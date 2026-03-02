"use client"

import { Receipt, Percent } from "lucide-react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Badge } from "@/components/ui/badge"
import { useFormatters } from "@/lib/use-formatters"

const taxEntries = [
  { id: "TAX-001", date: "2024-12-15", description: "Sales tax on Order #1042", taxableAmount: 2450.0, taxAmount: 245.0, status: "collected" },
  { id: "TAX-002", date: "2024-12-12", description: "Sales tax on Order #1039", taxableAmount: 1875.0, taxAmount: 187.5, status: "collected" },
  { id: "TAX-003", date: "2024-12-10", description: "Sales tax on Order #1035", taxableAmount: 3200.0, taxAmount: 320.0, status: "pending" },
  { id: "TAX-004", date: "2024-12-08", description: "Tax remittance - November", taxableAmount: 12400.0, taxAmount: 1240.0, status: "remitted" },
  { id: "TAX-005", date: "2024-11-30", description: "Sales tax on Order #1028", taxableAmount: 980.0, taxAmount: 98.0, status: "collected" },
  { id: "TAX-006", date: "2024-11-25", description: "Tax adjustment - Credit note", taxableAmount: 450.0, taxAmount: 45.0, status: "adjusted" },
]

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  collected: "default",
  pending: "secondary",
  remitted: "outline",
  adjusted: "destructive",
}

export default function TaxPage() {
  const t = useTranslations("finance")
  const tCommon = useTranslations("common")
  const { formatCurrency, formatDate } = useFormatters()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Receipt className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("taxManagement")}</h1>
          <p className="text-muted-foreground">{t("taxManagementDesc")}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title={t("currentTaxRate")}
          value="10%"
          icon={Percent}
        />
        <StatCard
          title={t("taxCollectedYTD")}
          value={formatCurrency(4825.0)}
          icon={Receipt}
          trend={{ value: 8.3, label: t("fromLastYear") }}
        />
        <StatCard
          title={t("taxRemittedYTD")}
          value={formatCurrency(3720.0)}
          icon={Receipt}
          trend={{ value: 5.1, label: t("fromLastYear") }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("taxEntries")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">{tCommon("date")}</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">{t("description")}</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">{t("taxableAmount")}</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">{t("tax10")}</th>
                  <th className="pb-3 font-medium text-muted-foreground">{tCommon("status")}</th>
                </tr>
              </thead>
              <tbody>
                {taxEntries.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 text-muted-foreground">{formatDate(entry.date)}</td>
                    <td className="py-3 pr-4">{entry.description}</td>
                    <td className="py-3 pr-4 text-right">{formatCurrency(entry.taxableAmount)}</td>
                    <td className="py-3 pr-4 text-right font-medium">{formatCurrency(entry.taxAmount)}</td>
                    <td className="py-3">
                      <Badge variant={statusVariant[entry.status] ?? "outline"}>
                        {entry.status}
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
