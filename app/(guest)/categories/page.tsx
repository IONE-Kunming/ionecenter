import Link from "next/link"
import Image from "next/image"
import {
  Building2, Shirt, Car, Briefcase, FlaskConical, Monitor, Smartphone, Zap,
  Cpu, Sun, Leaf, UtensilsCrossed, Armchair, Gamepad2, Wrench, Heart,
  TreePine, Refrigerator, Crosshair, Lightbulb, Luggage, Factory, Ruler,
  Gem, Printer, Shield, Footprints, Scissors, Truck, Package,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CATEGORIES, MAIN_CATEGORIES } from "@/types/categories"
import { getCategoryImage } from "@/lib/constants/category-images"

const categoryIcons: Record<string, React.ElementType> = {
  "Construction": Building2,
  "Apparel & Accessories": Shirt,
  "Automobiles & Motorcycles": Car,
  "Business Services": Briefcase,
  "Chemicals": FlaskConical,
  "Computer Products & Office Electronics": Monitor,
  "Consumer Electronics": Smartphone,
  "Electrical Equipment & Supplies": Zap,
  "Electronics Components & Supplies": Cpu,
  "Energy": Sun,
  "Environment": Leaf,
  "Food & Beverage": UtensilsCrossed,
  "Furniture": Armchair,
  "Gifts, Sports & Toys": Gamepad2,
  "Hardware": Wrench,
  "Health & Beauty": Heart,
  "Home & Garden": TreePine,
  "Home Appliances": Refrigerator,
  "Industry Laser Equipment": Crosshair,
  "Lights & Lighting": Lightbulb,
  "Luggage, Bags & Cases": Luggage,
  "Machinery": Factory,
  "Measurement & Analysis Instruments": Ruler,
  "Metallurgy, Mineral & Energy": Gem,
  "Packaging & Printing": Printer,
  "Security & Protection": Shield,
  "Shoes & Accessories": Footprints,
  "Textiles & Leather Products": Scissors,
  "Transportation": Truck,
}

export default function GuestCategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Browse Categories</h1>
        <p className="mt-2 text-muted-foreground">
          Explore our B2B Marketplace.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MAIN_CATEGORIES.map((categoryName) => {
          const category = CATEGORIES[categoryName]
          const Icon = categoryIcons[categoryName] || Package
          const imageUrl = getCategoryImage(categoryName)
          return (
            <Link
              key={categoryName}
              href={`/guest/catalog?category=${encodeURIComponent(categoryName)}`}
            >
              <Card className="group hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full overflow-hidden">
                {imageUrl ? (
                  <div className="relative h-[200px]">
                    <Image
                      src={imageUrl}
                      alt={categoryName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="font-semibold text-white">{categoryName}</h3>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 pb-0">
                    <div className="rounded-full bg-primary/10 p-3 w-fit group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mt-4 font-semibold">{categoryName}</h3>
                  </div>
                )}
                <CardContent className="p-6 pt-3">
                  <ul className="space-y-1">
                    {category.subcategories.map((sub) => (
                      <li key={sub} className="text-sm text-muted-foreground">
                        • {sub}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Signup CTA */}
      <div className="mt-12 text-center p-8 rounded-xl bg-muted/50">
        <h2 className="text-xl font-bold">Want to purchase? Create an account!</h2>
        <p className="mt-2 text-muted-foreground">Sign up as a buyer to add products to cart and place orders.</p>
        <Link href="/sign-up">
          <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Sign Up Now
          </button>
        </Link>
      </div>
    </div>
  )
}
