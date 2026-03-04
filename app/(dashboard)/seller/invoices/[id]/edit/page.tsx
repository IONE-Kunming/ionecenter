import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getInvoice } from "@/lib/actions/invoices"
import { getTranslations } from "next-intl/server"
import { EditInvoiceForm } from "./edit-invoice-form"

const getCachedInvoice = cache(getInvoice)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const invoice = await getCachedInvoice(id)
  const t = await getTranslations("invoices")
  if (!invoice) return { title: t("editInvoice") }
  return { title: `${t("editInvoice")} ${invoice.invoice_number}` }
}

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getCachedInvoice(id)

  if (!invoice) notFound()

  return <EditInvoiceForm invoice={invoice} />
}
