import { getCurrentUser, ensureSellerCode } from "@/lib/actions/users"
import { redirect } from "next/navigation"
import SellerProfileForm from "./profile-form"

export default async function SellerProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  const sellerCode = await ensureSellerCode(user)
  return <SellerProfileForm user={user} sellerCode={sellerCode} />
}
