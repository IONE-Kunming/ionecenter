"use client"

import { useState } from "react"
import { Receipt, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { InvoiceStatus } from "@/types/database"

const demoInvoices = [
  { id: "inv1", invoice_number: "INV-2025-00001", total: 275.00, deposit_paid: 82.50, remaining_balance: 192.50, status: "issued" as InvoiceStatus, due_date: "2025-02-15", created_at: "2025-01-15", buyer_name: "John Smith" },
]

export default function SellerInvoicesPage() {
  const [search, setSearch] = useState("")
  const filtered = demoInvoices.filter((inv) => !search || inv.invoice_number.includes(search) || inv.buyer_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices..." className="pl-9" /></div>
      {filtered.length > 0 ? (
        <Card><Table><TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Date</TableHead><TableHead>Buyer</TableHead><TableHead>Total</TableHead><TableHead>Paid</TableHead><TableHead>Balance</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map((inv) => (<TableRow key={inv.id}><TableCell className="font-medium">{inv.invoice_number}</TableCell><TableCell>{formatDate(inv.created_at)}</TableCell><TableCell>{inv.buyer_name}</TableCell><TableCell>{formatCurrency(inv.total)}</TableCell><TableCell>{formatCurrency(inv.deposit_paid)}</TableCell><TableCell>{formatCurrency(inv.remaining_balance)}</TableCell><TableCell>{formatDate(inv.due_date)}</TableCell><TableCell><InvoiceStatusBadge status={inv.status} /></TableCell></TableRow>))}</TableBody>
        </Table></Card>
      ) : (<EmptyState icon={Receipt} title="No invoices found" />)}
    </div>
  )
}
