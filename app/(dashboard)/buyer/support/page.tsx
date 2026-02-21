import { getSupportTickets } from "@/lib/actions/support"
import SupportClient from "./support-client"

export default async function BuyerSupportPage() {
  const tickets = await getSupportTickets()
  return <SupportClient tickets={tickets} />
}
