import { getProducts } from "@/lib/actions/products"
import { FinderResultsClient } from "@/components/landing/finder-results-client"
import { auth } from "@clerk/nextjs/server"
import { getCurrentUser } from "@/lib/actions/users"

export default async function FinderResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subcategory?: string; region?: string }>
}) {
  const { category, subcategory, region } = await searchParams

  /* Fetch products filtered by main category */
  const allProducts = await getProducts(category ? { category } : undefined)

  /* Further filter by subcategory if provided */
  const filtered = subcategory
    ? allProducts.filter((p) => p.category === subcategory)
    : allProducts

  const finderProducts = filtered.map((p) => ({
    id: p.id,
    name: p.name,
    model_number: p.model_number,
    main_category: p.main_category,
    category: p.category,
    price_per_meter: p.price_per_meter,
    pricing_type: p.pricing_type,
    price_cny: p.price_cny,
    stock: p.stock,
    image_url: p.image_url,
    seller_name: p.seller_name ?? null,
  }))

  /* Detect auth state for cart gating */
  let isLoggedIn = false
  let userRole: string | null = null
  try {
    const { userId } = await auth()
    if (userId) {
      isLoggedIn = true
      const user = await getCurrentUser()
      userRole = user?.role ?? null
    }
  } catch {
    // guest user
  }

  return (
    <FinderResultsClient
      products={finderProducts}
      category={category ?? ""}
      subcategory={subcategory ?? ""}
      region={region ?? ""}
      isLoggedIn={isLoggedIn}
      userRole={userRole}
    />
  )
}
