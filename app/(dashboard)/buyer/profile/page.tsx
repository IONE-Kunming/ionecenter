import { getCurrentUser, ensureBuyerCode } from "@/lib/actions/users"
import { redirect } from "next/navigation"
import BuyerProfileForm from "./profile-form"

export default async function BuyerProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  const buyerCode = await ensureBuyerCode(user)
  return <BuyerProfileForm user={user} buyerCode={buyerCode} />
}
