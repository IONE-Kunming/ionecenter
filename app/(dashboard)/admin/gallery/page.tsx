import { listAdminGalleryFolders, getAllSiteCategories } from "@/lib/actions/admin-gallery"
import { AdminGallery } from "./admin-gallery"

export default async function AdminGalleryPage() {
  let folders: Awaited<ReturnType<typeof listAdminGalleryFolders>> = []
  let categories: Awaited<ReturnType<typeof getAllSiteCategories>> = []
  try {
    folders = await listAdminGalleryFolders()
    categories = await getAllSiteCategories()
  } catch {
    // Tables may not exist yet – show empty state
  }
  return <AdminGallery initialFolders={folders} categories={categories} />
}
