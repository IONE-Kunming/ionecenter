import { getAllProducts } from "@/lib/actions/admin"
import { AdminProductsList } from "./admin-products-list"

export default async function AdminProductsPage() {
  const products = await getAllProducts()
  return <AdminProductsList products={products} />
}
