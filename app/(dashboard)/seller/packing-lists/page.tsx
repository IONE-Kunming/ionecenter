import { getSellerPackingLists } from "@/lib/actions/packing-lists"
import { PackingListsList } from "./packing-lists-list"

export default async function SellerPackingListsPage() {
  const packingLists = await getSellerPackingLists()

  const rows = packingLists.map((pl) => ({
    id: pl.id,
    packing_list_number: pl.packing_list_number,
    buyer_name: pl.buyer_name ?? "Unknown",
    buyer_email: pl.buyer_email ?? "",
    total_packages: pl.total_packages,
    total_net_weight: pl.total_net_weight,
    total_gross_weight: pl.total_gross_weight,
    created_at: pl.created_at,
  }))

  return <PackingListsList packingLists={rows} />
}
