import { getProducts } from "@/lib/actions/products"
import { AllProductsList } from "./all-products-list"

export default async function AllProductsPage() {
  const products = await getProducts()
  return <AllProductsList products={products} />
}
