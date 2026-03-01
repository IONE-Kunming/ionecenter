import { getSellerInvoices } from "@/lib/actions/invoices"
import { SellerInvoicesList } from "./invoices-list"

export default async function SellerInvoicesPage() {
  const invoices = await getSellerInvoices()

  const mapped = invoices.map((inv) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    total: inv.total,
    deposit_paid: inv.deposit_paid,
    remaining_balance: inv.remaining_balance,
    status: inv.status,
    due_date: inv.due_date ?? "",
    created_at: inv.created_at,
    buyer_name: inv.buyer?.display_name ?? inv.buyer_name ?? "Unknown",
  }))

  return <SellerInvoicesList invoices={mapped} />
}
