import Link from "next/link"
import { ArrowLeft, Package, ShoppingCart, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, getStockStatus } from "@/lib/utils"

// Demo product data
const products: Record<string, { name: string; model_number: string; category: string; main_category: string; price_per_meter: number; stock: number; description: string; seller: string }> = {
  "1": { name: "Premium Window Profile", model_number: "WP-6063-T5", category: "Window & Door Profiles", main_category: "Aluminum Profiles", price_per_meter: 12.50, stock: 500, description: "High-quality 6063-T5 aluminum window profile with thermal break technology. Ideal for residential and commercial window systems. Features excellent thermal insulation, corrosion resistance, and structural strength.", seller: "Kunming Aluminum Co." },
  "2": { name: "Curtain Wall Section", model_number: "CW-100-A", category: "Curtain Wall Profiles", main_category: "Aluminum Profiles", price_per_meter: 28.00, stock: 350, description: "Structural curtain wall profile for commercial buildings. Designed for high-rise applications with superior wind load resistance and waterproofing capabilities.", seller: "Kunming Aluminum Co." },
  "3": { name: "Industrial T-Slot Profile", model_number: "TS-4040-V2", category: "Industrial Profiles", main_category: "Aluminum Profiles", price_per_meter: 8.75, stock: 1200, description: "Versatile 40x40mm T-slot profile for industrial framing systems. Compatible with standard T-nuts and accessories. Perfect for machine guards, workstations, and material handling systems.", seller: "Kunming Aluminum Co." },
  "4": { name: "Coated Aluminum Sheet 3mm", model_number: "AS-3MM-PE", category: "Coated Sheets", main_category: "Aluminum Sheets", price_per_meter: 45.00, stock: 800, description: "PE coated aluminum sheet, 3mm thickness. Available in various colors including white, silver, bronze, and custom RAL colors. Suitable for exterior cladding and interior decoration.", seller: "Gulf Aluminum Industries" },
  "5": { name: "Tempered Glass Panel 10mm", model_number: "TG-10-CLR", category: "Tempered Glass", main_category: "Glass Products", price_per_meter: 65.00, stock: 200, description: "Clear tempered safety glass, 10mm thickness. Custom sizes available. Meets international safety standards for commercial and residential applications.", seller: "Gulf Aluminum Industries" },
}

export default async function GuestProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = products[id]

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
        <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center">
          <Package className="h-24 w-24 text-muted-foreground/20" />
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

          <Card className="mt-6">
            <CardContent className="p-4">
              <h3 className="font-semibold">Seller</h3>
              <p className="text-sm text-muted-foreground mt-1">{product.seller}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Description */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-3">Product Description</h2>
          <p className="text-muted-foreground">{product.description}</p>
        </CardContent>
      </Card>

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
