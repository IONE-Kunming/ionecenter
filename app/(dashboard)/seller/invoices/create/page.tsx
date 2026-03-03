import { CreateOfflineInvoiceForm } from "./create-invoice-form"
import { getOfflineInvoice } from "@/lib/actions/invoices"

export default async function CreateOfflineInvoicePage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const params = await searchParams
  const editId = params.edit
  let editData: { id: string; invoice_number: string; buyer_name: string; buyer_email: string; buyer_code: string | null; discount: number; amount_paid: number; items: { item_code: string | null; product_name: string | null; description: string | null; unit_price: number; quantity: number }[] } | null = null

  if (editId) {
    const invoice = await getOfflineInvoice(editId)
    if (invoice) {
      editData = {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        buyer_name: invoice.buyer_name ?? "",
        buyer_email: invoice.buyer_email ?? "",
        buyer_code: invoice.buyer_code,
        discount: invoice.discount,
        amount_paid: invoice.amount_paid,
        items: invoice.items.map((item) => ({
          item_code: item.item_code,
          product_name: item.product_name,
          description: item.description,
          unit_price: item.unit_price,
          quantity: item.quantity,
        })),
      }
    }
  }

  return <CreateOfflineInvoiceForm editData={editData} />
}
