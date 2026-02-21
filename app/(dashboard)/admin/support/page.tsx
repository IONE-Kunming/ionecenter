import { getSupportTickets } from "@/lib/actions/support"
import AdminSupportClient from "./support-client"

export default async function AdminSupportPage() {
  const tickets = await getSupportTickets()
  return <AdminSupportClient tickets={tickets} />
}
