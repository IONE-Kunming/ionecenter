import { getSiteCategories } from "@/lib/actions/site-settings"
import { AdminCategoriesList } from "./admin-categories-list"

export default async function AdminCategoriesPage() {
  let categories: Awaited<ReturnType<typeof getSiteCategories>> = []
  try {
    categories = await getSiteCategories()
  } catch {
    // Tables may not exist yet - show empty state
  }
  return <AdminCategoriesList categories={categories} />
}
