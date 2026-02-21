import { getCurrentUser } from "@/lib/actions/users"
import { redirect } from "next/navigation"
import SellerProfileForm from "./profile-form"

export default async function SellerProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  return <SellerProfileForm user={user} />
}
