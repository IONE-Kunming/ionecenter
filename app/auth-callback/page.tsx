import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/users"
import type { UserRole } from "@/types/database"

export default async function AuthCallbackPage() {
  const user = await currentUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Check Supabase first (source of truth for admin-assigned roles), then Clerk metadata
  const dbUser = await getCurrentUser()
  const role = (dbUser?.role as UserRole) || (user.publicMetadata?.role as UserRole | undefined)

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
