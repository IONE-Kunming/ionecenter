import { getBuyerContracts } from "@/lib/actions/contracts"
import { BuyerContractsList } from "./contracts-list"

export default async function BuyerContractsPage() {
  const contracts = await getBuyerContracts()

  const rows = contracts.map((c) => ({
    id: c.id,
    contract_number: c.contract_number,
    buyer_name: c.buyer_name ?? "Unknown",
    buyer_email: c.buyer_email ?? "",
    status: c.status,
    expiry_date: c.expiry_date ?? "",
    created_at: c.created_at,
  }))

  return <BuyerContractsList contracts={rows} />
}
