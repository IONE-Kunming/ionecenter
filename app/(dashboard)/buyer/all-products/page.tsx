import { getProducts } from "@/lib/actions/products"
import { getWishlistProductIds } from "@/lib/actions/wishlist"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { getProductsAllImages } from "@/lib/actions/product-images"
import { AllProductsList } from "./all-products-list"

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const [products, siteCategories, wishlistedIds] = await Promise.all([
    getProducts(),
    getSiteCategories(),
    getWishlistProductIds(),
  ])
  const categoryData = buildCategoryData(siteCategories)

  const allImages = await getProductsAllImages(products.map((p) => p.id))
  const productsWithImages = products.map((p) => ({
    ...p,
    images: allImages[p.id]?.length
      ? allImages[p.id]
      : p.image_url
        ? [{ id: "", product_id: p.id, image_url: p.image_url, is_primary: true, sort_order: 0, created_at: "" }]
        : [],
  }))

  return <AllProductsList products={productsWithImages} initialSearch={search || ""} categoryData={categoryData} wishlistedIds={wishlistedIds} />
}
