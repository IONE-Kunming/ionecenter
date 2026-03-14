import { getCurrentUser, ensureSellerCode, getSellerMainCategory } from "@/lib/actions/users"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { redirect } from "next/navigation"
import SellerProfileForm from "./profile-form"

export default async function SellerProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  const [sellerCode, siteCategories, sellerMainCategory] = await Promise.all([
    ensureSellerCode(user),
    getSiteCategories(),
    getSellerMainCategory(),
  ])
  const categoryData = buildCategoryData(siteCategories)
  return <SellerProfileForm user={user} sellerCode={sellerCode} mainCategories={categoryData.mainCategories} currentMainCategory={sellerMainCategory} />
}
