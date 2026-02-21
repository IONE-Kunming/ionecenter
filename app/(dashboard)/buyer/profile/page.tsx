import { getCurrentUser } from "@/lib/actions/users"
import { redirect } from "next/navigation"
import BuyerProfileForm from "./profile-form"

export default async function BuyerProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  return <BuyerProfileForm user={user} />
}
