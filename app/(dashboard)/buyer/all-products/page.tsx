import { getProducts } from "@/lib/actions/products"
import { AllProductsList } from "./all-products-list"

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const products = await getProducts()
  return <AllProductsList products={products} initialSearch={search || ""} />
}
