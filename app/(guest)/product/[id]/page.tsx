import Link from "@/components/ui/link"
import { ArrowLeft, Package, ShoppingCart, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDualPrice, getStockStatus, getIntlLocale } from "@/lib/utils"
import { getProduct } from "@/lib/actions/products"
import { getExchangeRate } from "@/lib/exchange-rate"
import { getLocale, getTranslations } from "next-intl/server"
import { ProductDetailGallery } from "@/components/catalog/product-detail-gallery"

export default async function GuestProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const locale = await getLocale()
  const intlLocale = getIntlLocale(locale)
  const [product, liveRate, tCatalog, tProduct, tOrders] = await Promise.all([
    getProduct(id),
    getExchangeRate(),
    getTranslations("catalog"),
    getTranslations("productDetail"),
    getTranslations("orders"),
  ])

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground/30" />
        <h1 className="mt-4 text-2xl font-bold">{tCatalog("productNotFound")}</h1>
        <p className="mt-2 text-muted-foreground">{tCatalog("productNotFoundDesc")}</p>
        <Link href="/guest/catalog">
          <Button className="mt-4">{tCatalog("backToCatalog")}</Button>
        </Link>
      </div>
    )
  }

  const stockStatus = getStockStatus(product.stock)

  // Build media list from product_images or fallback
  const imageMedia = product.images && product.images.length > 0
    ? product.images.map((img) => ({ type: "image" as const, url: img.image_url }))
    : product.image_url
      ? [{ type: "image" as const, url: product.image_url }]
      : []
  const videoMedia = (product.video_urls ?? []).map((u) => ({ type: "video" as const, url: u }))
  const allMedia = [...imageMedia, ...videoMedia]

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/guest/catalog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        {tCatalog("backToCatalog")}
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image Gallery */}
        <ProductDetailGallery media={allMedia} alt={product.name} />

        {/* Product Info */}
        <div>
          <Badge variant="secondary">{product.category}</Badge>
          <h1 className="mt-3 text-3xl font-bold">{product.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tProduct("modelNumber")}: {product.model_number}</p>

          <div className="mt-6">
            <span className="text-3xl font-bold text-primary">
              {formatDualPrice(product.price_per_meter, product.price_cny, product.pricing_type, liveRate, intlLocale)}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Badge variant={stockStatus.color === "green" ? "success" : stockStatus.color === "yellow" ? "warning" : "destructive"}>
              {stockStatus.label}
            </Badge>
            <span className="text-sm text-muted-foreground">{product.stock} {tProduct("unitsAvailable")}</span>
          </div>

          <div className="mt-6 space-y-3">
            <Link href="/sign-up" className="block">
              <Button className="w-full gap-2" size="lg">
                <ShoppingCart className="h-4 w-4" />
                {tCatalog("signUpToPurchase")}
              </Button>
            </Link>
            <Link href="/sign-up" className="block">
              <Button variant="outline" className="w-full gap-2" size="lg">
                <MessageSquare className="h-4 w-4" />
                {tCatalog("signUpToChat")}
              </Button>
            </Link>
          </div>

          {product.seller_name && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <h3 className="font-semibold">{tOrders("seller")}</h3>
                <p className="text-sm text-muted-foreground mt-1">{product.seller_name}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-3">{tProduct("productDescription")}</h2>
            <p className="text-muted-foreground">{product.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Specifications */}
      <Card className="mt-4">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-3">{tProduct("specifications")}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{tProduct("category")}</span>
              <span className="font-medium">{product.main_category}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{tProduct("subcategory")}</span>
              <span className="font-medium">{product.category}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{tProduct("modelNumber")}</span>
              <span className="font-medium">{product.model_number}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{tProduct("price")}</span>
              <span className="font-medium">{formatDualPrice(product.price_per_meter, product.price_cny, product.pricing_type, liveRate, intlLocale)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
