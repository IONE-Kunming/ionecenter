import { getSellerProducts } from "@/lib/actions/products"
import { getWishlistProductIds } from "@/lib/actions/wishlist"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { getProductsAllImages } from "@/lib/actions/product-images"
import { SellerProductsList } from "./products-list"

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const [products, siteCategories, wishlistedIds] = await Promise.all([
    getSellerProducts(),
    getSiteCategories(),
    getWishlistProductIds(),
  ])
  const categoryData = buildCategoryData(siteCategories)

  const allImages = await getProductsAllImages(products.map((p) => p.id))
  const productsWithImages = products.map((p) => ({
    ...p,
    images: allImages[p.id] ?? [],
  }))

  return <SellerProductsList initialProducts={productsWithImages} initialSearch={search || ""} categoryData={categoryData} wishlistedIds={wishlistedIds} />
}
