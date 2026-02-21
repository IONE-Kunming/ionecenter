import { getSellerBranches } from "@/lib/actions/branches"
import { BranchesList } from "./branches-list"

export default async function SellerBranchesPage() {
  const branches = await getSellerBranches()
  return <BranchesList initialBranches={branches} />
}
