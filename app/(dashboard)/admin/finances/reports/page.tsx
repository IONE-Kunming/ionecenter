import { FileText, BarChart3, PieChart, Users, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"

export default async function ReportsPage() {
  const t = await getTranslations("finance")

  const reports = [
    {
      title: t("incomeStatement"),
      description: t("incomeStatementFullDesc"),
      icon: BarChart3,
    },
    {
      title: t("balanceSheet"),
      description: t("balanceSheetFullDesc"),
      icon: PieChart,
    },
    {
      title: t("cashFlow"),
      description: t("cashFlowFullDesc"),
      icon: CreditCard,
    },
    {
      title: t("accountsReceivable"),
      description: t("accountsReceivableFullDesc"),
      icon: Users,
    },
    {
      title: t("accountsPayable"),
      description: t("accountsPayableFullDesc"),
      icon: FileText,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("financialReports")}</h1>
          <p className="text-muted-foreground">{t("financialReportsDesc")}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const ReportIcon = report.icon
          return (
            <Card key={report.title} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ReportIcon className="h-5 w-5 text-primary" />
                  {report.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <p className="text-sm text-muted-foreground">{report.description}</p>
                <Button className="w-full">{t("generateReport")}</Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
