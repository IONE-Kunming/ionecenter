import { getSellerContracts } from "@/lib/actions/contracts"
import { ContractsList } from "./contracts-list"

export default async function SellerContractsPage() {
  const contracts = await getSellerContracts()

  const rows = contracts.map((c) => ({
    id: c.id,
    contract_number: c.contract_number,
    buyer_name: c.buyer_name ?? "Unknown",
    buyer_email: c.buyer_email ?? "",
    status: c.status,
    expiry_date: c.expiry_date ?? "",
    created_at: c.created_at,
  }))

  return <ContractsList contracts={rows} />
}
