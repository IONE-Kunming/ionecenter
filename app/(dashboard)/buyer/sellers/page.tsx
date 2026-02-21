import { getSellers } from "@/lib/actions/users"
import { SellerDirectory } from "./seller-directory"

export default async function BuyerSellersPage() {
  const sellers = await getSellers()

  const mapped = sellers.map((s) => ({
    id: s.id,
    name: s.display_name,
    company: s.company ?? "",
    city: [s.city, s.country].filter(Boolean).join(", "),
  }))

  return <SellerDirectory sellers={mapped} />
}
