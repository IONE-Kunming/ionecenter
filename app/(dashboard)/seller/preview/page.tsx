import { getTranslations } from "next-intl/server"
import { getProducts } from "@/lib/actions/products"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { BuyerCatalogBrowser } from "@/app/(dashboard)/buyer/catalog/catalog-browser"

export default async function SellerPreviewPage() {
  const t = await getTranslations("sellerProducts")
  const [rawProducts, siteCategories] = await Promise.all([
    getProducts(),
    getSiteCategories(),
  ])
  const categoryData = buildCategoryData(siteCategories)
  const products = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    model_number: p.model_number,
    main_category: p.main_category,
    category: p.category,
    price_per_meter: p.price_per_meter,
    stock: p.stock,
    seller_name: p.seller_name ?? "",
    image_url: p.image_url ?? null,
  }))

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
        {t("buyerPreviewBanner")}
      </div>
      <BuyerCatalogBrowser products={products} categoryData={categoryData} />
    </div>
  )
}
