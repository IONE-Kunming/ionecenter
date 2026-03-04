import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageTitleProvider } from "@/components/layout/page-title-context"
import { ensureUserInSupabase, getCurrentUser } from "@/lib/actions/users"
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

  // Read role from Supabase (source of truth, editable by admin)
  const dbUser = await getCurrentUser()

  // Block deactivated users from accessing the dashboard
  if (dbUser && dbUser.is_active === false) {
    redirect("/sign-in")
  }

  const role = (dbUser?.role as UserRole) || "buyer"

  return (
    <div className="min-h-screen">
      <Sidebar role={role} />
      <div className="md:ms-64">
        <PageTitleProvider>
          <DashboardHeader />
          <main className="p-6">{children}</main>
        </PageTitleProvider>
      </div>
    </div>
  )
}
