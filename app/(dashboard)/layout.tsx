import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { ensureUserInSupabase } from "@/lib/actions/users"
import type { UserRole } from "@/types/database"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // Ensure user exists in Supabase (replaces webhook sync)
  await ensureUserInSupabase()

  const user = await currentUser()
  // Get role from Clerk metadata or default to buyer
  const role = (user?.publicMetadata?.role as UserRole) || "buyer"

  return (
    <div className="min-h-screen">
      <Sidebar role={role} />
      <div className="md:ml-64">
        <DashboardHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
