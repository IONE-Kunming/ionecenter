import { FileText, BarChart3, PieChart, Users, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const reports = [
  {
    title: "Income Statement",
    description: "Summary of revenues, expenses, and profit over a specific period. Track your business performance and profitability.",
    icon: BarChart3,
  },
  {
    title: "Balance Sheet",
    description: "Snapshot of your assets, liabilities, and equity at a point in time. Understand your financial position.",
    icon: PieChart,
  },
  {
    title: "Cash Flow",
    description: "Track cash inflows and outflows from operating, investing, and financing activities.",
    icon: CreditCard,
  },
  {
    title: "Accounts Receivable",
    description: "Overview of outstanding customer invoices and aging analysis. Monitor collection efficiency.",
    icon: Users,
  },
  {
    title: "Accounts Payable",
    description: "Summary of outstanding vendor bills and payment schedules. Manage your payment obligations.",
    icon: FileText,
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">Generate and view financial reports</p>
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
                <Button className="w-full">Generate Report</Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
