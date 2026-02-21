import { getAllInvoices } from "@/lib/actions/admin"
import { AdminInvoicesList } from "./admin-invoices-list"

export default async function AdminInvoicesPage() {
  const invoices = await getAllInvoices()

  const mapped = invoices.map((inv) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    total: inv.total,
    status: inv.status,
    created_at: inv.created_at,
    buyer_name: inv.buyer?.display_name ?? inv.buyer?.company ?? "Unknown",
    seller_name: inv.seller?.display_name ?? inv.seller?.company ?? "Unknown",
  }))

  return <AdminInvoicesList invoices={mapped} />
}
