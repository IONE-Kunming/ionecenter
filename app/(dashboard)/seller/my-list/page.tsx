import { getWishlistProducts } from "@/lib/actions/wishlist"
import { MyListContent } from "./my-list-content"

export default async function SellerMyListPage() {
  const wishlistProducts = await getWishlistProducts()
  return <MyListContent products={wishlistProducts} basePath="/seller/products" />
}
