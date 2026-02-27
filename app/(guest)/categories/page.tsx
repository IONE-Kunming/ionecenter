import Link from "@/components/ui/link"
import Image from "next/image"
import {
  Building2, Shirt, Car, Briefcase, FlaskConical, Monitor, Smartphone, Zap,
  Cpu, Sun, Leaf, UtensilsCrossed, Armchair, Gamepad2, Wrench, Heart,
  TreePine, Refrigerator, Crosshair, Lightbulb, Luggage, Factory, Ruler,
  Gem, Printer, Shield, Footprints, Scissors, Truck, Package,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { getSiteCategories } from "@/lib/actions/site-settings"
import type { SiteCategory } from "@/lib/actions/site-settings"

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

export default async function GuestCategoriesPage() {
  let allCategories: SiteCategory[] = []
  try {
    allCategories = await getSiteCategories()
  } catch {
    // Tables may not exist yet
  }

  const mainCategories = allCategories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order)

  const getSubcategories = (parentId: string) =>
    allCategories
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Browse Categories</h1>
        <p className="mt-2 text-muted-foreground">
          Explore Our Wide Range B2B Product Categories.
        </p>
      </div>

      {mainCategories.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No categories available yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mainCategories.map((category) => {
            const Icon = categoryIcons[category.name] || Package
            const subs = getSubcategories(category.id)
            return (
              <Link
                key={category.id}
                href={`/guest/catalog?category=${encodeURIComponent(category.name)}`}
              >
                <Card className="group hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full overflow-hidden">
                  {category.image_url ? (
                    <div className="relative h-[200px]">
                      <Image
                        src={category.image_url}
                        alt={category.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="font-semibold text-white">{category.name}</h3>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 pb-0">
                      <div className="rounded-full bg-primary/10 p-3 w-fit group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="mt-4 font-semibold">{category.name}</h3>
                    </div>
                  )}
                  <CardContent className="p-6 pt-3">
                    <ul className="space-y-1">
                      {subs.map((sub) => (
                        <li key={sub.id} className="text-sm text-muted-foreground">
                          • {sub.name}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

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
