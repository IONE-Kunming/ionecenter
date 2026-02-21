import { getSupportTickets } from "@/lib/actions/support"
import SupportClient from "./support-client"

export default async function SellerSupportPage() {
  const tickets = await getSupportTickets()
  return <SupportClient tickets={tickets} />
}
