import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/users"
import { getProduct } from "@/lib/actions/products"
import { getWishlistProductIds } from "@/lib/actions/wishlist"
import { SellerProductDetail } from "./seller-product-detail"

export default async function SellerProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const { id } = await params
  const [product, wishlistedIds] = await Promise.all([
    getProduct(id),
    getWishlistProductIds(),
  ])

  if (!product) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Product Not Found</h1>
        <p className="mt-2 text-muted-foreground">The product you are looking for does not exist.</p>
      </div>
    )
  }

  return <SellerProductDetail product={product} wishlistedIds={wishlistedIds} />
}
