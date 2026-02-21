import { getBuyerInvoices } from "@/lib/actions/invoices"
import { BuyerInvoicesList } from "./invoices-list"

export default async function BuyerInvoicesPage() {
  const invoices = await getBuyerInvoices()

  const mapped = invoices.map((inv) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    total: inv.total,
    deposit_paid: inv.deposit_paid,
    remaining_balance: inv.remaining_balance,
    status: inv.status,
    due_date: inv.due_date ?? "",
    created_at: inv.created_at,
    seller_name: inv.seller?.display_name ?? inv.seller?.company ?? "Unknown",
  }))

  return <BuyerInvoicesList invoices={mapped} />
}
