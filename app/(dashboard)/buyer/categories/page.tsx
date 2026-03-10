import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { BuyerCategoriesClient } from "./categories-client"

export default async function BuyerCategoriesPage() {
  const siteCategories = await getSiteCategories()
  const categoryData = buildCategoryData(siteCategories)

  return <BuyerCategoriesClient categoryData={categoryData} />
}
