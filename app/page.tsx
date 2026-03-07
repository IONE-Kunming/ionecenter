import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getProducts } from "@/lib/actions/products"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { getCurrentUser } from "@/lib/actions/users"
import { LandingPageClient } from "@/components/landing/landing-page-client"
import { clerkClient } from "@clerk/nextjs/server"

export default async function HomePage() {
  const { userId } = await auth()

  let userRole: string | null = null
  let userImageUrl: string | null = null
  let userFullName: string | null = null

  if (userId) {
    try {
      const dbUser = await getCurrentUser()
      userRole = dbUser?.role ?? null

      // Redirect sellers and admins to their dashboards
      if (userRole === "seller") redirect("/seller/dashboard")
      if (userRole === "admin") redirect("/admin/dashboard")

      // Get Clerk user info for the profile icon
      const clerk = await clerkClient()
      const clerkUser = await clerk.users.getUser(userId)
      userImageUrl = clerkUser.imageUrl ?? null
      userFullName = clerkUser.fullName ?? clerkUser.firstName ?? null
    } catch {
      // If getCurrentUser fails (e.g. deactivated), continue as guest
    }
  }

  const [products, siteCategories] = await Promise.all([
    getProducts(),
    getSiteCategories(),
  ])

  const categoryData = buildCategoryData(siteCategories)

  // Filter to only categories/subcategories that have products
  const categoriesWithProducts = [...new Set(products.map((p) => p.main_category))]
  const subcategoriesWithProducts = [...new Set(products.map((p) => p.category))]

  return (
    <LandingPageClient
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        model_number: p.model_number,
        main_category: p.main_category,
        category: p.category,
        price_per_meter: p.price_per_meter,
        pricing_type: p.pricing_type,
        price_cny: p.price_cny,
        stock: p.stock,
        image_url: p.image_url ?? null,
      }))}
      categoryData={categoryData}
      categoriesWithProducts={categoriesWithProducts}
      subcategoriesWithProducts={subcategoriesWithProducts}
      isLoggedIn={!!userId}
      userRole={userRole}
      userImageUrl={userImageUrl}
      userFullName={userFullName}
    />
  )
}
