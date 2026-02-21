import { getSellerProducts } from "@/lib/actions/products"
import { SellerProductsList } from "./products-list"

export default async function SellerProductsPage() {
  const products = await getSellerProducts()
  return <SellerProductsList initialProducts={products} />
}
