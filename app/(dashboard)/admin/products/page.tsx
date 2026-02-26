import { getAllProducts } from "@/lib/actions/admin"
import { AdminProductsList } from "./admin-products-list"

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const products = await getAllProducts()
  return <AdminProductsList products={products} initialSearch={search || ""} />
}
