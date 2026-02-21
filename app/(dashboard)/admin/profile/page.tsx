import { getCurrentUser } from "@/lib/actions/users"
import { redirect } from "next/navigation"
import AdminProfileForm from "./profile-form"

export default async function AdminProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  return <AdminProfileForm user={user} />
}
