import { getSellerProducts } from "@/lib/actions/products"
import { SellerProductsList } from "./products-list"

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const products = await getSellerProducts()
  return <SellerProductsList initialProducts={products} initialSearch={search || ""} />
}
