import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { BuyerDashboardHeader } from "@/components/layout/buyer-dashboard-header"
import { PageTitleProvider } from "@/components/layout/page-title-context"
import { ProductsPageHeaderProvider } from "@/components/layout/products-page-context"
import { PreviewSearchProvider } from "@/components/layout/preview-search-context"
import { CategoriesSearchProvider } from "@/components/layout/categories-search-context"
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
  const isBuyer = role === "buyer"

  if (isBuyer) {
    // Buyer layout: sidebar + buyer-specific header
    return (
      <div className="min-h-screen">
        <Sidebar role={role} />
        <div className="md:ms-64">
          <PageTitleProvider>
            <BuyerDashboardHeader />
            <main className="p-4 md:p-6">{children}</main>
          </PageTitleProvider>
        </div>
      </div>
    )
  }

  // Seller / Admin layout: sidebar + dashboard header
  return (
    <div className="min-h-screen">
      <Sidebar role={role} />
      <div className="md:ms-64">
        <PageTitleProvider>
          <ProductsPageHeaderProvider>
            <PreviewSearchProvider>
              <CategoriesSearchProvider>
                <DashboardHeader />
                <main className="p-6">{children}</main>
              </CategoriesSearchProvider>
            </PreviewSearchProvider>
          </ProductsPageHeaderProvider>
        </PageTitleProvider>
      </div>
    </div>
  )
}
