import Link from "next/link"
import {
  Shield, Globe, Zap, BarChart3, Users, Headphones,
  ArrowRight, CheckCircle, Play, Twitter, Linkedin, Instagram, Mail,
  Package, Building2, Layers, Wrench, Box, Blocks
} from "lucide-react"
import { getTranslations } from "next-intl/server"
import { LanguageSwitcher } from "@/components/language-switcher"

const serviceKeys = [
  { num: "01", title: "secureTrading", desc: "secureTradingDesc" },
  { num: "02", title: "globalMarketplace", desc: "globalMarketplaceDesc" },
  { num: "03", title: "fastProcessing", desc: "fastProcessingDesc" },
  { num: "04", title: "financialTools", desc: "financialToolsDesc" },
  { num: "05", title: "sellerNetwork", desc: "sellerNetworkDesc" },
  { num: "06", title: "support", desc: "supportDesc" },
] as const

const teamMembers = [
  { name: "Sarah Chen", role: "CEO & Founder", initials: "SC" },
  { name: "Ahmed Hassan", role: "CTO", initials: "AH" },
  { name: "Maria Lopez", role: "Head of Operations", initials: "ML" },
  { name: "James Wu", role: "Lead Developer", initials: "JW" },
]

const testimonials = [
  { quote: "IONE Center transformed our supply chain. The platform is incredibly efficient and the support team is outstanding.", author: "David Kim", company: "KimTrade Co." },
  { quote: "We've expanded to 15 new markets since joining. The global reach and multi-language support are game changers.", author: "Fatima Al-Rashid", company: "Gulf Exports LLC" },
  { quote: "The financial tools and real-time tracking give us complete visibility over our B2B operations.", author: "Carlos Mendez", company: "Mendez Industries" },
]

const baseBrandNames = [
  "Global Trade", "Pacific Supply", "Euro Materials", "Asia Connect",
  "Atlantic Partners", "Nordic Wholesale", "Desert Trading", "Ocean Freight",
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

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 w-full z-50 bg-black/40 backdrop-blur-sm">
        <div className="max-w-[1320px] mx-auto flex h-20 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C4EF17] text-black font-bold text-lg">
              IC
            </div>
            <span className="text-xl font-bold text-white">IONE Center</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 nav-menu">
            <Link href="#services" className="text-sm text-[#ABB8C3] hover:text-white transition-colors">
              {nav("features")}
            </Link>
            <Link href="#about" className="text-sm text-[#ABB8C3] hover:text-white transition-colors">
              {footerT("aboutUs")}
            </Link>
            <Link href="#portfolio" className="text-sm text-[#ABB8C3] hover:text-white transition-colors">
              {nav("products")}
            </Link>
            <Link href="#testimonials" className="text-sm text-[#ABB8C3] hover:text-white transition-colors">
              {howT("title")}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/sign-in" className="hidden sm:inline-flex text-sm text-[#ABB8C3] hover:text-white transition-colors px-4 py-2">
              {nav("logIn")}
            </Link>
            <Link href="/sign-up" className="circle-btn text-sm !py-2.5 !px-6">
              <span className="button__bg" />
              <span className="relative z-10">{nav("signUp")}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000] via-[#131923]/50 to-[#000000]" />
        {/* Decorative blurred circles */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[#C4EF17]/5 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#003796]/10 blur-[100px]" />

        <div className="relative max-w-[1320px] mx-auto px-6 py-20 md:py-32 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="fade-in-up">
              <p className="text-[14px] uppercase tracking-[3px] text-[#ABB8C3] mb-6">
                {statsT("activeUsers")} — B2B {nav("products")}
              </p>
              <h1 className="text-[48px] md:text-[80px] leading-[1.05] tracking-tight text-white">
                {hero("titleLine1")}
                <span className="block text-[#C4EF17]">{hero("titleLine2")}</span>
              </h1>
              <p className="mt-8 text-lg text-[#ABB8C3] max-w-lg leading-relaxed">
                {hero("description")}
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Link href="/sign-up" className="circle-btn !py-4 !px-10 text-base">
                  <span className="button__bg" />
                  <span className="relative z-10 flex items-center gap-2">
                    {hero("getStarted")} <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
                <Link href="/guest/catalog" className="link-arrow">
                  {hero("browseCatalog")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="relative hidden md:block fade-in-up fade-in-up-delay-2">
              {/* Layered hero image area with overlapping cards */}
              <div className="relative h-[500px]">
                <div className="absolute top-0 right-0 w-[320px] h-[400px] rounded-2xl bg-gradient-to-br from-[#131923] to-[#1a2332] border border-white/10 flex items-center justify-center">
                  <div className="text-center px-8">
                    <div className="w-16 h-16 rounded-full bg-[#C4EF17] mx-auto mb-4 flex items-center justify-center">
                      <Globe className="h-8 w-8 text-black" />
                    </div>
                    <p className="text-2xl font-bold text-white">125+</p>
                    <p className="text-[#ABB8C3] text-sm mt-1">{statsT("countries")}</p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-[280px] h-[350px] rounded-2xl bg-gradient-to-br from-[#0a1628] to-[#131923] border border-white/10 flex items-center justify-center">
                  <div className="text-center px-8">
                    <div className="w-16 h-16 rounded-full bg-[#00fcfa] mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-8 w-8 text-black" />
                    </div>
                    <p className="text-2xl font-bold text-white">80K+</p>
                    <p className="text-[#ABB8C3] text-sm mt-1">{statsT("happyCustomers")}</p>
                  </div>
                </div>
                <div className="absolute top-[200px] right-[180px] w-[200px] h-[200px] rounded-2xl bg-gradient-to-br from-[#C4EF17]/10 to-transparent border border-[#C4EF17]/20 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-[#C4EF17]">$50M+</p>
                    <p className="text-[#ABB8C3] text-xs mt-1">{statsT("inTransactions")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BRAND STRIP / MARQUEE ===== */}
      <section className="border-y border-white/10 bg-[#131923]/50">
        <div className="marquee">
          <div className="marquee-content">
            {brandNames.map((name, i) => (
              <span key={i} className="inline-flex items-center mx-10 text-[#ABB8C3]/60 text-lg font-medium tracking-wide">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SERVICES SECTION ===== */}
      <section id="services" className="py-24 md:py-32 bg-[#000000]">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="mb-16 fade-in-up">
            <p className="text-[14px] uppercase tracking-[3px] text-[#ABB8C3] mb-4">
              {featuresT("subtitle")}
            </p>
            <h2 className="text-[40px] md:text-[50px] leading-[1.2] text-white">
              {featuresT("title")}
            </h2>
          </div>
          <div className="horizontal-scroll">
            {serviceKeys.map((sk) => (
              <div key={sk.num} className="service-card min-w-[300px] md:min-w-[380px]">
                <div className="service-number">{sk.num}</div>
                <h3 className="mt-6 text-xl text-white">{featuresT(sk.title)}</h3>
                <p className="mt-3 text-sm text-[#ABB8C3] leading-relaxed">{featuresT(sk.desc)}</p>
                <div className="mt-6">
                  <ArrowRight className="h-5 w-5 text-[#C4EF17]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT SECTION WITH STATS ===== */}
      <section id="about" className="py-24 md:py-32 bg-[#131923] relative overflow-hidden">
        {/* Background decorative element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#003796]/10 to-transparent" />
        <div className="relative max-w-[1320px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="fade-in-up">
              <p className="text-[14px] uppercase tracking-[3px] text-[#ABB8C3] mb-4">
                {footerT("aboutUs")}
              </p>
              <h2 className="text-[40px] md:text-[50px] leading-[1.2] text-white mb-6">
                {benefitsT("title")}
              </h2>
              <p className="text-[#ABB8C3] leading-relaxed mb-8">
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
                  <li key={benefit} className="flex items-center gap-3 text-sm text-white">
                    <CheckCircle className="h-5 w-5 text-[#C4EF17] shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-6 fade-in-up fade-in-up-delay-2">
              <div className="stat-card">
                <p className="text-[42px] font-bold text-[#C4EF17]">80K</p>
                <p className="text-[#ABB8C3] text-sm mt-2">{statsT("happyCustomers")}</p>
              </div>
              <div className="stat-card">
                <p className="text-[42px] font-bold text-[#00fcfa]">125</p>
                <p className="text-[#ABB8C3] text-sm mt-2">{statsT("countries")}</p>
              </div>
              <div className="stat-card">
                <p className="text-[42px] font-bold text-[#ffe34c]">$50M+</p>
                <p className="text-[#ABB8C3] text-sm mt-2">{statsT("inTransactions")}</p>
              </div>
              <div className="stat-card">
                <p className="text-[42px] font-bold text-white">99.9%</p>
                <p className="text-[#ABB8C3] text-sm mt-2">{statsT("uptime")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PORTFOLIO / PRODUCTS SECTION ===== */}
      <section id="portfolio" className="py-24 md:py-32 bg-[#000000]">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="text-center mb-16 fade-in-up">
            <p className="text-[14px] uppercase tracking-[3px] text-[#ABB8C3] mb-4">
              {nav("products")}
            </p>
            <h2 className="text-[40px] md:text-[50px] leading-[1.2] text-white">
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
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#C4EF17] text-black text-2xl font-bold">
                  {s.step}
                </div>
                <h3 className="mt-6 text-xl text-white">{s.title}</h3>
                <p className="mt-3 text-sm text-[#ABB8C3] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== VIDEO SECTION ===== */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#131923] to-[#000000]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iODAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==')] opacity-30" />
        <div className="relative max-w-[1320px] mx-auto px-6 text-center">
          <div className="fade-in-up">
            <p className="text-[14px] uppercase tracking-[3px] text-[#ABB8C3] mb-4">
              {howT("subtitle")}
            </p>
            <h2 className="text-[40px] md:text-[60px] leading-[1.1] text-white max-w-3xl mx-auto mb-12">
              {ctaT("title")}
            </h2>
            <div className="play-button mx-auto">
              <Play className="h-8 w-8 text-black ml-1" fill="black" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="py-24 md:py-32 bg-[#000000]">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="text-center mb-16 fade-in-up">
            <p className="text-[14px] uppercase tracking-[3px] text-[#ABB8C3] mb-4">
              {statsT("activeUsers")}
            </p>
            <h2 className="text-[40px] md:text-[50px] leading-[1.2] text-white">
              {ctaT("testimonialsHeading")}
            </h2>
          </div>
          <div className="horizontal-scroll">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card min-w-[340px] md:min-w-[440px]">
                <div className="text-[#C4EF17] text-4xl mb-4">&ldquo;</div>
                <p className="text-white leading-relaxed text-lg mb-8">{t.quote}</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#C4EF17]/20 flex items-center justify-center text-[#C4EF17] font-bold text-sm">
                    {t.author.split(" ").filter(n => n.length > 0).map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-white font-medium">{t.author}</p>
                    <p className="text-[#ABB8C3] text-sm">{t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TEAM SECTION ===== */}
      <section className="py-24 md:py-32 bg-[#131923]">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="text-center mb-16 fade-in-up">
            <p className="text-[14px] uppercase tracking-[3px] text-[#ABB8C3] mb-4">
              {footerT("company")}
            </p>
            <h2 className="text-[40px] md:text-[50px] leading-[1.2] text-white">
              {footerT("aboutUs")}
            </h2>
          </div>
          <div className="horizontal-scroll">
            {teamMembers.map((member) => (
              <div key={member.name} className="team-card min-w-[260px] md:min-w-[300px] h-[380px]">
                <div className="w-full h-full bg-gradient-to-br from-[#1a2332] to-[#0a1628] flex items-center justify-center">
                  <span className="text-[64px] font-bold text-white/10">{member.initials}</span>
                </div>
                <div className="team-overlay">
                  <h3 className="text-white text-xl">{member.name}</h3>
                  <p className="text-[#C4EF17] text-sm mt-1">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-24 md:py-32 bg-[#000000] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#C4EF17]/5 blur-[150px]" />
        </div>
        <div className="relative max-w-[1320px] mx-auto px-6 text-center">
          <div className="fade-in-up">
            <h2 className="text-[40px] md:text-[60px] leading-[1.1] text-white max-w-3xl mx-auto">
              {ctaT("title")}
            </h2>
            <p className="mt-6 text-[#ABB8C3] max-w-xl mx-auto text-lg">
              {ctaT("subtitle")}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              <Link href="/sign-up" className="circle-btn !py-4 !px-10 text-base">
                <span className="button__bg" />
                <span className="relative z-10 flex items-center gap-2">
                  {ctaT("createAccount")} <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link href="/guest/catalog" className="link-arrow text-base">
                {ctaT("exploreProducts")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/10 bg-[#131923] py-16">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Logo & description */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C4EF17] text-black font-bold text-lg">
                  IC
                </div>
                <span className="text-xl font-bold text-white">IONE Center</span>
              </div>
              <p className="text-[#ABB8C3] text-sm leading-relaxed mb-6">
                {footerT("description")}
              </p>
              <div className="flex gap-3">
                <span className="social-icon"><Twitter className="h-4 w-4" /></span>
                <span className="social-icon"><Linkedin className="h-4 w-4" /></span>
                <span className="social-icon"><Instagram className="h-4 w-4" /></span>
                <span className="social-icon"><Mail className="h-4 w-4" /></span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{footerT("platform")}</h4>
              <ul className="space-y-3 text-sm text-[#ABB8C3]">
                <li><Link href="/guest/categories" className="hover:text-[#C4EF17] transition-colors">{nav("categories")}</Link></li>
                <li><Link href="/guest/catalog" className="hover:text-[#C4EF17] transition-colors">{nav("products")}</Link></li>
                <li><Link href="/sign-up" className="hover:text-[#C4EF17] transition-colors">{footerT("becomeASeller")}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{footerT("company")}</h4>
              <ul className="space-y-3 text-sm text-[#ABB8C3]">
                <li><Link href="#" className="hover:text-[#C4EF17] transition-colors">{footerT("aboutUs")}</Link></li>
                <li><Link href="#" className="hover:text-[#C4EF17] transition-colors">{footerT("contact")}</Link></li>
                <li><Link href="#" className="hover:text-[#C4EF17] transition-colors">{footerT("careers")}</Link></li>
                <li><Link href="#" className="hover:text-[#C4EF17] transition-colors">{footerT("privacyPolicy")}</Link></li>
                <li><Link href="#" className="hover:text-[#C4EF17] transition-colors">{footerT("termsOfService")}</Link></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{footerT("newsletter")}</h4>
              <p className="text-[#ABB8C3] text-sm mb-4">{footerT("newsletterDesc")}</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={footerT("emailPlaceholder")}
                  className="newsletter-input flex-1 text-sm"
                />
                <button className="h-[46px] px-6 rounded-full bg-[#C4EF17] text-black text-sm font-medium hover:bg-[#d4ff27] transition-colors">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-[#ABB8C3]">
            {footerT("copyright", { year: new Date().getFullYear() })}
          </div>
        </div>
      </footer>
    </div>
  )
}
