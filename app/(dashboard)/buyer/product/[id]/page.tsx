import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/users"
import { getProduct } from "@/lib/actions/products"
import { getUserRole } from "@/lib/actions/roles"
import { ProductDetail } from "./product-detail"

export default async function BuyerProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const [{ id }, userRole] = await Promise.all([params, getUserRole()])

  console.log("[BuyerProductDetailPage] product id from URL params:", id)

  const product = await getProduct(id)

  console.log("[BuyerProductDetailPage] getProduct result:", product ? { id: product.id, name: product.name } : null)

  if (!product) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Product Not Found</h1>
        <p className="mt-2 text-muted-foreground">The product you are looking for does not exist.</p>
      </div>
    )
  }

  return <ProductDetail product={product} currentUserId={user.id} userRole={userRole} />
}
