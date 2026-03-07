import { getProducts } from "@/lib/actions/products"
import { getSiteCategories } from "@/lib/actions/site-settings"
import { buildCategoryData } from "@/lib/categories"
import { CatalogGrid } from "@/components/catalog/catalog-grid"
import { getTranslations } from "next-intl/server"

export default async function GuestCatalogPage() {
  const [products, siteCategories, t] = await Promise.all([
    getProducts(),
    getSiteCategories(),
    getTranslations("catalog"),
  ])
  const categoryData = buildCategoryData(siteCategories)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("catalogTitle")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("catalogDesc")}
        </p>
      </div>
      <CatalogGrid products={products} basePath="/product" showSignupCta categoryData={categoryData} />
    </div>
  )
}
