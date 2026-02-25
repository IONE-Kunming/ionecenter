import Link from "next/link"
import {
  Globe, Users,
  ArrowRight, CheckCircle, Twitter, Linkedin, Instagram, Mail,
} from "lucide-react"
import { getTranslations } from "next-intl/server"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"

const serviceKeys = [
  { num: "01", title: "secureTrading", desc: "secureTradingDesc" },
  { num: "02", title: "globalMarketplace", desc: "globalMarketplaceDesc" },
  { num: "03", title: "fastProcessing", desc: "fastProcessingDesc" },
  { num: "04", title: "financialTools", desc: "financialToolsDesc" },
  { num: "05", title: "sellerNetwork", desc: "sellerNetworkDesc" },
  { num: "06", title: "support", desc: "supportDesc" },
] as const

const teamMembers = [
  { name: "Khalil Shwaiki", roleKey: "ceoAndFounder", image: "/team/Khalil Shwaiki.png", contain: true },
  { name: "Ye Chenwang", roleKey: "cofounder", image: "/team/Ye Chenwang.png", contain: false },
  { name: "Abed Shwaiki", roleKey: "generalManager", image: "/team/Abed Shwaiki.png", contain: false },
  { name: "Ihab Ghanemat", roleKey: "boardOfDirectorsMember", image: "/team/Ihab Ghanemat.png", contain: false },
  { name: "Mohamed Zurob", roleKey: "middleEastSalesDirector", image: "/team/Mohamed Zurob.png", contain: false },
  { name: "Mohamed Radwan", roleKey: "svpAndHeadOfCX", image: "/team/Mohamed Radwan.jpg", contain: false },
  { name: "Moxi", roleKey: "chiefOfSecretary", image: "/team/Moxi.png", contain: true },
  { name: "Tala Qassrawi", roleKey: "leadDeveloper", image: "/team/Tala Qassrawi.jpg", contain: false },
  { name: "Rowan Ghoniem", roleKey: "marketingDirector", image: "/team/Rawan Ghoniem.jpg", contain: false },
  { name: "Mohamed Said", roleKey: "middleEastSalesManager", image: "/team/Mohamed Said.png", contain: true },
  { name: "Mohamed Qassrawi", roleKey: "salesExpert", image: "/team/Mohamed Qassrawi.png", contain: false },
]
const teamMembersDouble = [...teamMembers, ...teamMembers]

const testimonials = [
  { quote: "IONE Center transformed our supply chain. The platform is incredibly efficient and the support team is outstanding.", author: "David Kim", company: "KimTrade Co." },
  { quote: "We've expanded to 15 new markets since joining. The global reach and multi-language support are game changers.", author: "Fatima Al-Rashid", company: "Gulf Exports LLC" },
  { quote: "The financial tools and real-time tracking give us complete visibility over our B2B operations.", author: "Carlos Mendez", company: "Mendez Industries" },
]

const baseBrandNames = [
  "IONE Palestine", "IONE Saudi Arabia", "IONE Kunming", "IONE Shenzhen",
]
const brandNames = [...baseBrandNames, ...baseBrandNames]

export default async function LandingPage() {
  const nav = await getTranslations("nav")
  const hero = await getTranslations("hero")
  const statsT = await getTranslations("stats")
  const featuresT = await getTranslations("features")
  const howT = await getTranslations("howItWorks")
  const benefitsT = await getTranslations("benefits")
  const ctaT = await getTranslations("cta")
  const footerT = await getTranslations("footer")
  const teamT = await getTranslations("team")

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-[1320px] mx-auto flex h-20 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="IONE Center" className="h-10 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {nav("features")}
            </Link>
            <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {footerT("aboutUs")}
            </Link>
            <Link href="#portfolio" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {nav("products")}
            </Link>
            <Link href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {howT("title")}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link href="/sign-in" className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
              {nav("logIn")}
            </Link>
            <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              {nav("signUp")}
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
        {/* Decorative blurred circles */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[100px]" />

        <div className="relative max-w-[1320px] mx-auto px-6 py-20 md:py-32 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="fade-in-up">
              <p className="text-[14px] uppercase tracking-[3px] text-muted-foreground mb-6">
                {statsT("activeUsers")} — B2B {nav("products")}
              </p>
              <h1 className="text-[48px] md:text-[72px] leading-[1.05] tracking-tight">
                {hero("titleLine1")}
                <span className="block text-primary">{hero("titleLine2")}</span>
              </h1>
              <p className="mt-8 text-lg text-muted-foreground max-w-lg leading-relaxed">
                {hero("description")}
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  {hero("getStarted")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/guest/catalog" className="inline-flex items-center gap-2 text-sm uppercase tracking-wider text-primary hover:gap-3 transition-all">
                  {hero("browseCatalog")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="relative hidden md:block fade-in-up fade-in-up-delay-2">
              {/* Layered hero image area with overlapping cards */}
              <div className="relative h-[500px]">
                <div className="absolute top-0 right-0 w-[320px] h-[400px] rounded-2xl bg-card border border-border flex items-center justify-center">
                  <div className="text-center px-8">
                    <div className="w-16 h-16 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center">
                      <Globe className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <p className="text-2xl font-bold">125+</p>
                    <p className="text-muted-foreground text-sm mt-1">{statsT("countries")}</p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-[280px] h-[350px] rounded-2xl bg-card border border-border flex items-center justify-center">
                  <div className="text-center px-8">
                    <div className="w-16 h-16 rounded-full bg-cyan-500 dark:bg-[#00fcfa] mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-8 w-8 text-white dark:text-black" />
                    </div>
                    <p className="text-2xl font-bold">80K+</p>
                    <p className="text-muted-foreground text-sm mt-1">{statsT("happyCustomers")}</p>
                  </div>
                </div>
                <div className="absolute top-[200px] right-[180px] w-[200px] h-[200px] rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">$50M+</p>
                    <p className="text-muted-foreground text-xs mt-1">{statsT("inTransactions")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BRAND STRIP / MARQUEE ===== */}
      <section className="border-y border-border bg-muted/30">
        <div className="marquee">
          <div className="marquee-content">
            {brandNames.map((name, i) => (
              <span key={i} className="inline-flex items-center mx-10 text-muted-foreground/60 text-lg font-medium tracking-wide">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SERVICES SECTION ===== */}
      <section id="services" className="py-24 md:py-32">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="mb-16 fade-in-up">
            <p className="text-[14px] uppercase tracking-[3px] text-muted-foreground mb-4">
              {featuresT("subtitle")}
            </p>
            <h2 className="text-[36px] md:text-[50px] leading-[1.2]">
              {featuresT("title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceKeys.map((sk) => (
              <div key={sk.num} className="service-card">
                <div className="service-number">{sk.num}</div>
                <h3 className="mt-6 text-xl">{featuresT(sk.title)}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{featuresT(sk.desc)}</p>
                <div className="mt-6">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT SECTION WITH STATS ===== */}
      <section id="about" className="py-24 md:py-32 bg-muted/50 relative overflow-hidden">
        {/* Background decorative element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/5 to-transparent" />
        <div className="relative max-w-[1320px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="fade-in-up">
              <p className="text-[14px] uppercase tracking-[3px] text-muted-foreground mb-4">
                {footerT("aboutUs")}
              </p>
              <h2 className="text-[36px] md:text-[50px] leading-[1.2] mb-6">
                {benefitsT("title")}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                {benefitsT("subtitle")}
              </p>
              <ul className="space-y-4">
                {[
                  benefitsT("multiSeller"),
                  benefitsT("flexibleDeposit"),
                  benefitsT("realtimeChat"),
                  benefitsT("financialReporting"),
                  benefitsT("multiLanguage"),
                  benefitsT("automatedInvoice"),
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-6 fade-in-up fade-in-up-delay-2">
              <div className="stat-card">
                <p className="text-[36px] md:text-[42px] font-bold text-primary">80K</p>
                <p className="text-muted-foreground text-sm mt-2">{statsT("happyCustomers")}</p>
              </div>
              <div className="stat-card">
                <p className="text-[36px] md:text-[42px] font-bold text-cyan-600 dark:text-[#00fcfa]">125</p>
                <p className="text-muted-foreground text-sm mt-2">{statsT("countries")}</p>
              </div>
              <div className="stat-card">
                <p className="text-[36px] md:text-[42px] font-bold text-amber-600 dark:text-[#ffe34c]">$50M+</p>
                <p className="text-muted-foreground text-sm mt-2">{statsT("inTransactions")}</p>
              </div>
              <div className="stat-card">
                <p className="text-[36px] md:text-[42px] font-bold">99.9%</p>
                <p className="text-muted-foreground text-sm mt-2">{statsT("uptime")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PORTFOLIO / PRODUCTS SECTION ===== */}
      <section id="portfolio" className="py-24 md:py-32">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="text-center mb-16 fade-in-up">
            <p className="text-[14px] uppercase tracking-[3px] text-muted-foreground mb-4">
              {nav("products")}
            </p>
            <h2 className="text-[36px] md:text-[50px] leading-[1.2]">
              {howT("title")}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: howT("step1Title"), desc: howT("step1Desc") },
              { step: "02", title: howT("step2Title"), desc: howT("step2Desc") },
              { step: "03", title: howT("step3Title"), desc: howT("step3Desc") },
            ].map((s, i) => (
              <div key={s.step} className="text-center fade-in-up" style={{ animationDelay: `${(i + 1) * 0.1}s` }}>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                  {s.step}
                </div>
                <h3 className="mt-6 text-xl">{s.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== VIDEO SECTION ===== */}
      <section className="py-24 md:py-32 relative overflow-hidden bg-muted/30">
        <div className="relative max-w-[1320px] mx-auto px-6 text-center">
          <div className="fade-in-up">
            <p className="text-[14px] uppercase tracking-[3px] text-muted-foreground mb-4">
              {howT("subtitle")}
            </p>
            <h2 className="text-[36px] md:text-[56px] leading-[1.1] max-w-3xl mx-auto mb-12">
              {ctaT("title")}
            </h2>
            <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden border border-border">
              <video
                className="w-full"
                controls
                preload="metadata"
                poster=""
              >
                <source src="/Our%20Factory.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="py-24 md:py-32">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="text-center mb-16 fade-in-up">
            <p className="text-[14px] uppercase tracking-[3px] text-muted-foreground mb-4">
              {statsT("activeUsers")}
            </p>
            <h2 className="text-[36px] md:text-[50px] leading-[1.2]">
              {ctaT("testimonialsHeading")}
            </h2>
          </div>
          <div className="horizontal-scroll">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card min-w-[320px] md:min-w-[420px] max-w-[480px]">
                <div className="text-primary text-4xl mb-4">&ldquo;</div>
                <p className="leading-relaxed text-lg mb-8">{t.quote}</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {t.author.split(" ").filter(n => n.length > 0).map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium">{t.author}</p>
                    <p className="text-muted-foreground text-sm">{t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TEAM SECTION ===== */}
      <section className="py-24 md:py-32 bg-muted/50">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="text-center mb-16 fade-in-up">
            <p className="text-[14px] uppercase tracking-[3px] text-muted-foreground mb-4">
              {footerT("company")}
            </p>
            <h2 className="text-[36px] md:text-[50px] leading-[1.2]">
              {footerT("aboutUs")}
            </h2>
          </div>
        </div>
        <div className="team-marquee">
          <div className="team-marquee-content">
            {teamMembersDouble.map((member, i) => (
              <div key={`${member.name}-${i}`} className="shrink-0 w-[260px] flex flex-col">
                <div className="team-card w-full h-[300px] bg-muted/50">
                  <img
                    src={member.image}
                    alt={member.name}
                    className={`w-full h-full ${member.contain ? "object-contain" : "object-cover"}`}
                  />
                </div>
                <div className="pt-3 text-center">
                  <h3 className="text-base font-semibold">{member.name}</h3>
                  <p className="text-primary text-sm mt-0.5">{teamT(member.roleKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />
        </div>
        <div className="relative max-w-[1320px] mx-auto px-6 text-center">
          <div className="fade-in-up">
            <h2 className="text-[36px] md:text-[56px] leading-[1.1] max-w-3xl mx-auto">
              {ctaT("title")}
            </h2>
            <p className="mt-6 text-muted-foreground max-w-xl mx-auto text-lg">
              {ctaT("subtitle")}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                {ctaT("createAccount")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/guest/catalog" className="inline-flex items-center gap-2 text-base uppercase tracking-wider text-primary hover:gap-3 transition-all">
                {ctaT("exploreProducts")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border bg-card py-16">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Logo & description */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo.svg" alt="IONE Center" className="h-10 w-auto" />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {footerT("description")}
              </p>
              <div className="flex gap-3">
                <span className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"><Twitter className="h-4 w-4" /></span>
                <span className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"><Linkedin className="h-4 w-4" /></span>
                <span className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"><Instagram className="h-4 w-4" /></span>
                <span className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"><Mail className="h-4 w-4" /></span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">{footerT("platform")}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/guest/categories" className="hover:text-primary transition-colors">{nav("categories")}</Link></li>
                <li><Link href="/guest/catalog" className="hover:text-primary transition-colors">{nav("products")}</Link></li>
                <li><Link href="/sign-up" className="hover:text-primary transition-colors">{footerT("becomeASeller")}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">{footerT("company")}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">{footerT("aboutUs")}</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">{footerT("contact")}</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">{footerT("careers")}</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">{footerT("privacyPolicy")}</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">{footerT("termsOfService")}</Link></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">{footerT("newsletter")}</h4>
              <p className="text-muted-foreground text-sm mb-4">{footerT("newsletterDesc")}</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={footerT("emailPlaceholder")}
                  className="flex-1 rounded-full border border-border bg-muted px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                />
                <button className="h-[42px] w-[42px] rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            {footerT("copyright", { year: new Date().getFullYear() })}
          </div>
        </div>
      </footer>
    </div>
  )
}
