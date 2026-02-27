import { getWishlistProducts } from "@/lib/actions/wishlist"
import { MyListContent } from "@/components/wishlist/my-list-content"

export default async function BuyerMyListPage() {
  const wishlistProducts = await getWishlistProducts()
  return <MyListContent products={wishlistProducts} basePath="/buyer/product" />
}
