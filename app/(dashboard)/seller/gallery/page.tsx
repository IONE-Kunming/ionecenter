import { listGallery } from "@/lib/actions/gallery"
import { GalleryClient } from "./gallery-client"

export default async function SellerGalleryPage() {
  const { folders, files } = await listGallery()
  return <GalleryClient initialFolders={folders} initialFiles={files} currentPath="" />
}
