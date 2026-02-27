import { getSiteCategories } from "@/lib/actions/site-settings"
import { getSiteSetting } from "@/lib/actions/site-settings"
import { AdminCategoriesList } from "./admin-categories-list"

export default async function AdminCategoriesPage() {
  let categories: Awaited<ReturnType<typeof getSiteCategories>> = []
  let videoUrl = ""
  try {
    categories = await getSiteCategories()
    videoUrl = await getSiteSetting("homepage_video_url")
  } catch {
    // Tables may not exist yet - show empty state
  }
  return <AdminCategoriesList categories={categories} videoUrl={videoUrl} />
}
