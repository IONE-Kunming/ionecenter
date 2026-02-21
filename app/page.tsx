import Link from "next/link"
import {
  Shield, Globe, Zap, BarChart3, Users, Headphones,
  ArrowRight, CheckCircle, Package, Building2, Layers,
  Wrench, Box, Blocks
} from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LanguageSwitcher } from "@/components/language-switcher"

const featureIcons = [Shield, Globe, Zap, BarChart3, Users, Headphones]
const featureKeys = [
  { title: "secureTrading", desc: "secureTradingDesc" },
  { title: "globalMarketplace", desc: "globalMarketplaceDesc" },
  { title: "fastProcessing", desc: "fastProcessingDesc" },
  { title: "financialTools", desc: "financialToolsDesc" },
  { title: "sellerNetwork", desc: "sellerNetworkDesc" },
  { title: "support", desc: "supportDesc" },
] as const

const categoryIcons = [Layers, Box, Blocks, Wrench, Building2, Package, Wrench, Box]
const categoryNames = [
  "Aluminum Profiles", "Aluminum Sheets", "Glass Products",
  "Hardware & Accessories", "Steel Products", "Insulation Materials",
  "Tools & Equipment", "Raw Materials",
]
const categoryCounts = ["50K+", "30K+", "25K+", "40K+", "20K+", "15K+", "10K+", "8K+"]

export default async function LandingPage() {
  const nav = await getTranslations("nav")
  const hero = await getTranslations("hero")
  const statsT = await getTranslations("stats")
  const featuresT = await getTranslations("features")
  const categoriesT = await getTranslations("categories")
  const howT = await getTranslations("howItWorks")
  const benefitsT = await getTranslations("benefits")
  const ctaT = await getTranslations("cta")
  const footerT = await getTranslations("footer")

  const stats = [
    { value: "1,000+", label: statsT("activeUsers") },
    { value: "$50M+", label: statsT("inTransactions") },
    { value: "99.9%", label: statsT("uptime") },
    { value: "200K+", label: statsT("products") },
  ]

  const steps = [
    { step: "01", title: howT("step1Title"), description: howT("step1Desc") },
    { step: "02", title: howT("step2Title"), description: howT("step2Desc") },
    { step: "03", title: howT("step3Title"), description: howT("step3Desc") },
  ]

  const benefitsList = [
    benefitsT("multiSeller"),
    benefitsT("flexibleDeposit"),
    benefitsT("realtimeChat"),
    benefitsT("financialReporting"),
    benefitsT("multiLanguage"),
    benefitsT("automatedInvoice"),
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              IC
            </div>
            <span className="text-xl font-bold">IONE Center</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/guest/categories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {nav("categories")}
            </Link>
            <Link href="/guest/catalog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {nav("products")}
            </Link>
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {nav("features")}
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {nav("howItWorks")}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">{nav("logIn")}</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">{nav("signUp")}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            {hero("titleLine1")}
            <span className="block text-primary">{hero("titleLine2")}</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            {hero("description")}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                {hero("getStarted")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/guest/catalog">
              <Button variant="outline" size="lg">
                {hero("browseCatalog")}
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
            <h2 className="text-3xl font-bold">{featuresT("title")}</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              {featuresT("subtitle")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureKeys.map((fk, i) => {
              const Icon = featureIcons[i]
              return (
                <Card key={fk.title} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="rounded-full bg-primary/10 p-3 w-fit group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{featuresT(fk.title)}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{featuresT(fk.desc)}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{categoriesT("title")}</h2>
            <p className="mt-3 text-muted-foreground">
              {categoriesT("subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categoryNames.map((name, i) => {
              const Icon = categoryIcons[i]
              return (
                <Link key={name} href={`/guest/catalog?category=${encodeURIComponent(name)}`}>
                  <Card className="group hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer h-full">
                    <CardContent className="p-6 text-center">
                      <Icon className="h-8 w-8 mx-auto text-primary" />
                      <h3 className="mt-3 font-semibold text-sm">{name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{categoryCounts[i]} {categoriesT("productsLabel")}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{howT("title")}</h2>
            <p className="mt-3 text-muted-foreground">
              {howT("subtitle")}
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
              <h2 className="text-3xl font-bold">{benefitsT("title")}</h2>
              <p className="mt-4 text-muted-foreground">
                {benefitsT("subtitle")}
              </p>
              <ul className="mt-6 space-y-3">
                {benefitsList.map((benefit) => (
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
                <p className="text-sm text-muted-foreground mt-1">{benefitsT("taxRate")}</p>
              </Card>
              <Card className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">4</p>
                <p className="text-sm text-muted-foreground mt-1">{benefitsT("paymentMethods")}</p>
              </Card>
              <Card className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">7</p>
                <p className="text-sm text-muted-foreground mt-1">{benefitsT("currencies")}</p>
              </Card>
              <Card className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">24/7</p>
                <p className="text-sm text-muted-foreground mt-1">{benefitsT("supportLabel")}</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">{ctaT("title")}</h2>
          <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
            {ctaT("subtitle")}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" variant="secondary" className="gap-2">
                {ctaT("createAccount")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/guest/catalog">
              <Button size="lg" variant="outline" className="text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10">
                {ctaT("exploreProducts")}
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
                  IC
                </div>
                <span className="font-bold">IONE Center</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {footerT("description")}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{footerT("platform")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/guest/categories" className="hover:text-foreground">{nav("categories")}</Link></li>
                <li><Link href="/guest/catalog" className="hover:text-foreground">{nav("products")}</Link></li>
                <li><Link href="/sign-up" className="hover:text-foreground">{footerT("becomeASeller")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{footerT("company")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">{footerT("aboutUs")}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{footerT("contact")}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{footerT("careers")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{footerT("legal")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">{footerT("privacyPolicy")}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{footerT("termsOfService")}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{footerT("cookiePolicy")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            {footerT("copyright", { year: new Date().getFullYear() })}
          </div>
        </div>
      </footer>
    </div>
  )
}
