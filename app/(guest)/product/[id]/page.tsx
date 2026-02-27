import Link from "@/components/ui/link"
import Image from "next/image"
import { ArrowLeft, Package, ShoppingCart, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, getStockStatus } from "@/lib/utils"
import { getProduct } from "@/lib/actions/products"

export default async function GuestProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground/30" />
        <h1 className="mt-4 text-2xl font-bold">Product Not Found</h1>
        <p className="mt-2 text-muted-foreground">The product you are looking for does not exist.</p>
        <Link href="/guest/catalog">
          <Button className="mt-4">Back to Catalog</Button>
        </Link>
      </div>
    )
  }

  const stockStatus = getStockStatus(product.stock)

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/guest/catalog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Catalog
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="aspect-square relative bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized
            />
          ) : (
            <Package className="h-24 w-24 text-muted-foreground/20" />
          )}
        </div>

        {/* Product Info */}
        <div>
          <Badge variant="secondary">{product.category}</Badge>
          <h1 className="mt-3 text-3xl font-bold">{product.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Model: {product.model_number}</p>

          <div className="mt-6">
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(product.price_per_meter)}
            </span>
            <span className="text-muted-foreground">/meter</span>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Badge variant={stockStatus.color === "green" ? "success" : stockStatus.color === "yellow" ? "warning" : "destructive"}>
              {stockStatus.label}
            </Badge>
            <span className="text-sm text-muted-foreground">{product.stock} units available</span>
          </div>

          <div className="mt-6 space-y-3">
            <Link href="/sign-up" className="block">
              <Button className="w-full gap-2" size="lg">
                <ShoppingCart className="h-4 w-4" />
                Sign Up to Purchase
              </Button>
            </Link>
            <Link href="/sign-up" className="block">
              <Button variant="outline" className="w-full gap-2" size="lg">
                <MessageSquare className="h-4 w-4" />
                Sign Up to Chat with Seller
              </Button>
            </Link>
          </div>

          {product.seller_name && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <h3 className="font-semibold">Seller</h3>
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
            <h2 className="text-lg font-semibold mb-3">Product Description</h2>
            <p className="text-muted-foreground">{product.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Specifications */}
      <Card className="mt-4">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-3">Specifications</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">{product.main_category}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Subcategory</span>
              <span className="font-medium">{product.category}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Model Number</span>
              <span className="font-medium">{product.model_number}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Price per Meter</span>
              <span className="font-medium">{formatCurrency(product.price_per_meter)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
