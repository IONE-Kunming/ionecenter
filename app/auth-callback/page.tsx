import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type { UserRole } from "@/types/database"

export default async function AuthCallbackPage() {
  const user = await currentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const role = user.publicMetadata?.role as UserRole | undefined

  if (!role) {
    redirect("/select-role")
  }

  switch (role) {
    case "seller":
      redirect("/seller/dashboard")
    case "admin":
      redirect("/admin/dashboard")
    case "buyer":
    default:
      redirect("/buyer/catalog")
  }
}
