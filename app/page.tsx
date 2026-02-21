import Link from "next/link"
import {
  Shield, Globe, Zap, BarChart3, Users, Headphones,
  ArrowRight, CheckCircle, Package, Building2, Layers,
  Wrench, Box, Blocks
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const stats = [
  { value: "1,000+", label: "Active Users" },
  { value: "$50M+", label: "In Transactions" },
  { value: "99.9%", label: "Uptime" },
  { value: "200K+", label: "Products" },
]

const features = [
  {
    icon: Shield,
    title: "Secure Trading",
    description: "Enterprise-grade security with encrypted transactions and verified sellers.",
  },
  {
    icon: Globe,
    title: "Global Marketplace",
    description: "Connect with suppliers and buyers across the globe in multiple languages.",
  },
  {
    icon: Zap,
    title: "Fast Processing",
    description: "Streamlined order processing with real-time status tracking.",
  },
  {
    icon: BarChart3,
    title: "Financial Tools",
    description: "Comprehensive financial management with reports, tax, and reconciliation.",
  },
  {
    icon: Users,
    title: "Seller Network",
    description: "Browse verified sellers with product catalogs and direct messaging.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated support team to help with orders, payments, and inquiries.",
  },
]

const categories = [
  { name: "Aluminum Profiles", icon: Layers, count: "50K+" },
  { name: "Aluminum Sheets", icon: Box, count: "30K+" },
  { name: "Glass Products", icon: Blocks, count: "25K+" },
  { name: "Hardware & Accessories", icon: Wrench, count: "40K+" },
  { name: "Steel Products", icon: Building2, count: "20K+" },
  { name: "Insulation Materials", icon: Package, count: "15K+" },
  { name: "Tools & Equipment", icon: Wrench, count: "10K+" },
  { name: "Raw Materials", icon: Box, count: "8K+" },
]

const steps = [
  {
    step: "01",
    title: "Browse & Select",
    description: "Explore our vast catalog of aluminum and construction materials from verified suppliers.",
  },
  {
    step: "02",
    title: "Order & Pay",
    description: "Place orders with flexible deposit options and multiple payment methods.",
  },
  {
    step: "03",
    title: "Track & Receive",
    description: "Monitor your orders in real-time from processing to delivery at your doorstep.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              IA
            </div>
            <span className="text-xl font-bold">IONE AlumaTech</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/guest/categories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Categories
            </Link>
            <Link href="/guest/catalog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Products
            </Link>
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            B2B Aluminum & Construction
            <span className="block text-primary">Materials Trading Platform</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Trade aluminum profiles, sheets, glass products, and construction materials with trusted suppliers worldwide. Streamlined ordering, secure payments, and real-time tracking.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/guest/catalog">
              <Button variant="outline" size="lg">
                Browse Catalog
              </Button>
            </Link>
          </div>
          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Why Choose IONE AlumaTech?</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Everything you need to manage your B2B construction materials business.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="rounded-full bg-primary/10 p-3 w-fit group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Browse Categories</h2>
            <p className="mt-3 text-muted-foreground">
              Explore our comprehensive catalog of construction materials.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link key={cat.name} href={`/guest/catalog?category=${encodeURIComponent(cat.name)}`}>
                <Card className="group hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <cat.icon className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="mt-3 font-semibold text-sm">{cat.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{cat.count} products</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="mt-3 text-muted-foreground">
              Start trading in three simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {step.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold">Built for B2B Trading Excellence</h2>
              <p className="mt-4 text-muted-foreground">
                Our platform is designed specifically for the aluminum and construction materials industry, providing tools that streamline every aspect of your business.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Multi-seller order management",
                  "Flexible deposit payment system",
                  "Real-time chat with sellers",
                  "Comprehensive financial reporting",
                  "Multi-language support (EN, ZH, AR, UR)",
                  "Automated invoice generation",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">10%</p>
                <p className="text-sm text-muted-foreground mt-1">Tax Rate</p>
              </Card>
              <Card className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">4</p>
                <p className="text-sm text-muted-foreground mt-1">Payment Methods</p>
              </Card>
              <Card className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">7</p>
                <p className="text-sm text-muted-foreground mt-1">Currencies</p>
              </Card>
              <Card className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">24/7</p>
                <p className="text-sm text-muted-foreground mt-1">Support</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to Start Trading?</h2>
          <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
            Join thousands of businesses already trading on IONE AlumaTech. Create your free account today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" variant="secondary" className="gap-2">
                Create Free Account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/guest/catalog">
              <Button size="lg" variant="outline" className="text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10">
                Explore Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  IA
                </div>
                <span className="font-bold">IONE AlumaTech</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your trusted B2B platform for aluminum and construction materials.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/guest/categories" className="hover:text-foreground">Categories</Link></li>
                <li><Link href="/guest/catalog" className="hover:text-foreground">Products</Link></li>
                <li><Link href="/sign-up" className="hover:text-foreground">Become a Seller</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-foreground">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} IONE AlumaTech. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
