"use client"

import { useState, useMemo, useTransition } from "react"
import { useTranslations } from "next-intl"
import Link from "@/components/ui/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import {
  Package, Search, ShoppingCart, ChevronRight, ChevronDown, Menu, X,
  Check, Loader2, User, LogOut, Heart, MessageSquare, Bell, HelpCircle,
  LayoutDashboard, FileText, Receipt, FileSignature, ArrowRight
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { formatDualPrice } from "@/lib/utils"
import { useExchangeRate } from "@/lib/use-exchange-rate"
import { addToCart } from "@/lib/actions/cart"
import type { CategoryData } from "@/lib/categories"
import { toCategoryKey } from "@/lib/categories"
import type { PricingType } from "@/types/database"
import { useClerk } from "@clerk/nextjs"
import { Avatar } from "@/components/ui/avatar"

interface LandingProduct {
  id: string
  name: string
  model_number: string
  main_category: string
  category: string
  price_per_meter: number
  pricing_type?: PricingType
  price_cny?: number | null
  stock: number
  image_url: string | null
}

interface LandingPageClientProps {
  products: LandingProduct[]
  categoryData: CategoryData
  categoriesWithProducts: string[]
  subcategoriesWithProducts: string[]
  isLoggedIn: boolean
  userRole: string | null
  userImageUrl?: string | null
  userFullName?: string | null
}



export function LandingPageClient({
  products,
  categoryData,
  categoriesWithProducts,
  subcategoriesWithProducts,
  isLoggedIn,
  userRole,
  userImageUrl,
  userFullName,
}: LandingPageClientProps) {
  const t = useTranslations("catalog")
  const tNav = useTranslations("nav")
  const tCommon = useTranslations("common")
  const tCart = useTranslations("cart")
  const tProfile = useTranslations("profileMenu")
  const tCatNames = useTranslations("categoryNames")
  const tCategories = useTranslations("categories")
  const { rate } = useExchangeRate()
  const { signOut } = useClerk()
  const searchParams = useSearchParams()

  const [, startTransition] = useTransition()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "")
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get("subcategory") || "")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [cartCount, setCartCount] = useState(0)
  const [showSignInDialog, setShowSignInDialog] = useState(false)

  const translateCat = (name: string): string => {
    const key = toCategoryKey(name)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translated = (tCatNames as any)(key)
    return typeof translated === "string" && translated !== key ? translated : name
  }

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) {
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat)
    setSelectedSubcategory("")
    setSidebarOpen(false)
  }

  const handleSelectSubcategory = (sub: string) => {
    setSelectedSubcategory(sub)
    setSidebarOpen(false)
  }

  const handleAddToCart = (productId: string) => {
    if (!isLoggedIn || userRole !== "buyer") {
      setShowSignInDialog(true)
      return
    }
    if (addingIds.has(productId)) return
    setAddingIds((prev) => new Set(prev).add(productId))
    startTransition(async () => {
      try {
        const result = await addToCart(productId, 1)
        if (!result.error) {
          setAddedIds((prev) => new Set(prev).add(productId))
          setCartCount((c) => c + 1)
          setTimeout(() => {
            setAddedIds((prev) => {
              const next = new Set(prev)
              next.delete(productId)
              return next
            })
          }, 2000)
        }
      } finally {
        setAddingIds((prev) => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })
      }
    })
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.model_number.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !selectedCategory || p.main_category === selectedCategory
      const matchesSubcategory = !selectedSubcategory || p.category === selectedSubcategory
      return matchesSearch && matchesCategory && matchesSubcategory
    })
  }, [products, search, selectedCategory, selectedSubcategory])


  // Only show categories/subcategories that have products
  const visibleCategories = categoryData.mainCategories.filter((cat) =>
    categoriesWithProducts.includes(cat)
  )

  const getVisibleSubcategories = (cat: string) =>
    (categoryData.categoryMap[cat] ?? []).filter((sub) =>
      subcategoriesWithProducts.includes(sub)
    )

  const profileMenuItems = isLoggedIn && userRole === "buyer"
    ? [
        { label: tProfile("home"), href: "/", icon: LayoutDashboard },
        { label: tProfile("orders"), href: "/buyer/orders", icon: FileText },
        { label: tProfile("cart"), href: "/buyer/cart", icon: ShoppingCart },
        { label: tProfile("myList"), href: "/buyer/my-list", icon: Heart },
        { label: tProfile("invoices"), href: "/buyer/invoices", icon: Receipt },
        { label: tProfile("contracts"), href: "/buyer/contracts", icon: FileSignature },
        { label: tProfile("chats"), href: "/buyer/chats", icon: MessageSquare },
        { label: tProfile("support"), href: "/buyer/support", icon: HelpCircle },
        { label: tProfile("profile"), href: "/buyer/profile", icon: User },
      ]
    : []

  const categoriesSidebar = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm uppercase tracking-wider">{t("categories")}</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded hover:bg-accent md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {/* All Products */}
        <button
          onClick={() => { setSelectedCategory(""); setSelectedSubcategory(""); setSidebarOpen(false) }}
          className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-start mb-1 ${
            !selectedCategory ? "bg-accent font-medium" : "hover:bg-accent/50"
          }`}
        >
          <Package className="h-4 w-4 shrink-0" />
          {t("allProducts")}
        </button>

        {/* Category list */}
        {visibleCategories.map((cat) => {
          const subs = getVisibleSubcategories(cat)
          const isExpanded = expandedCategories.has(cat)
          const isSelected = selectedCategory === cat

          return (
            <div key={cat} className="mb-0.5">
              <div className="flex items-center">
                <button
                  onClick={() => handleSelectCategory(cat)}
                  className={`flex-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-start ${
                    isSelected && !selectedSubcategory ? "bg-accent font-medium" : "hover:bg-accent/50"
                  }`}
                >
                  {translateCat(cat)}
                </button>
                {subs.length > 0 && (
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="p-1.5 rounded hover:bg-accent/50 transition-colors"
                  >
                    {isExpanded
                      ? <ChevronDown className="h-3.5 w-3.5" />
                      : <ChevronRight className="h-3.5 w-3.5" />
                    }
                  </button>
                )}
              </div>

              {/* Subcategories */}
              {isExpanded && subs.length > 0 && (
                <div className="ml-4 mt-0.5 border-l pl-3 space-y-0.5">
                  {subs.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => { handleSelectCategory(cat); handleSelectSubcategory(sub) }}
                      className={`w-full flex items-center rounded-lg px-3 py-1.5 text-xs transition-colors text-start ${
                        selectedSubcategory === sub ? "bg-accent font-medium" : "hover:bg-accent/50 text-muted-foreground"
                      }`}
                    >
                      {translateCat(sub)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="max-w-[1480px] mx-auto flex h-16 items-center justify-between px-4 gap-3">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-accent transition-colors md:hidden"
              aria-label="Toggle categories"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="IONE Center" width={130} height={36} className="h-9 w-auto" />
            </Link>
          </div>

          {/* Center: search bar */}
          <div className="flex-1 max-w-lg hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value) }}
                placeholder={tCommon("searchProducts")}
                className="pl-9 h-9 rounded-full"
              />
            </div>
          </div>

          {/* Right: nav + auth */}
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden md:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
              {tNav("aboutUs")}
            </Link>
            <LanguageSwitcher />
            <ThemeToggle />

            {isLoggedIn && userRole === "buyer" ? (
              /* Profile icon for logged-in buyers */
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full p-1 hover:bg-accent transition-colors"
                >
                  <Avatar
                    src={userImageUrl ?? undefined}
                    alt={userFullName || "User"}
                    fallback={(userFullName || "U").charAt(0)}
                    size="sm"
                  />
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute end-0 top-10 z-50 w-52 rounded-xl border bg-background shadow-lg py-1">
                      <div className="px-4 py-2.5 border-b">
                        <p className="text-sm font-medium truncate">{userFullName || "User"}</p>
                        <p className="text-xs text-muted-foreground">{tCommon("active")}</p>
                      </div>
                      {profileMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
                        >
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t mt-1">
                        <button
                          onClick={() => signOut({ redirectUrl: "/" })}
                          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          {tProfile("signOut")}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : !isLoggedIn ? (
              /* Guest buttons */
              <>
                <Link href="/sign-up?intent=seller">
                  <Button size="sm" variant="outline" className="hidden sm:inline-flex">
                    {tNav("becomeSeller")}
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    {tNav("logIn")}
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm" className="hidden sm:inline-flex">
                    {tNav("signUpFree")}
                  </Button>
                </Link>
              </>
            ) : (
              /* Seller/Admin notification bell */
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Mobile search */}
        <div className="px-4 pb-3 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value) }}
              placeholder={tCommon("searchProducts")}
              className="pl-9 h-9 rounded-full"
            />
          </div>
        </div>
      </header>

      {/* ===== BROWSE CATEGORIES SECTION ===== */}
      {categoryData.mainCategories.length > 0 && (
        <section className="border-b bg-muted/30">
          <div className="max-w-[1480px] mx-auto px-4 py-8 md:py-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">{tCategories("browseCategories")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{tCategories("browseCategoriesDesc")}</p>
              </div>
              <Link href="/guest/categories">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-1">
                  {tCategories("viewAllCategories")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {categoryData.mainCategories.slice(0, 5).map((categoryName) => {
                const subcategories = categoryData.categoryMap[categoryName] ?? []
                const imageUrl = categoryData.categoryImageMap[categoryName] ?? null
                const displayName = translateCat(categoryName)
                return (
                  <Link
                    key={categoryName}
                    href={`/guest/categories?category=${encodeURIComponent(categoryName)}`}
                  >
                    <Card className="group hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full overflow-hidden">
                      {imageUrl ? (
                        <div className="relative h-[140px] md:h-[170px]">
                          <Image
                            src={imageUrl}
                            alt={displayName}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="font-semibold text-white text-sm md:text-base line-clamp-1">{displayName}</h3>
                            <p className="text-xs text-white/80 mt-0.5">
                              {tCategories("subcategoryCount", { count: subcategories.length })}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <CardContent className="p-4 md:p-5 flex flex-col items-start h-full">
                          <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                            <Package className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="mt-3 font-semibold text-sm md:text-base line-clamp-1">{displayName}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {tCategories("subcategoryCount", { count: subcategories.length })}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                )
              })}
            </div>

            {/* Mobile "View All" button */}
            <div className="mt-4 text-center sm:hidden">
              <Link href="/guest/categories">
                <Button variant="outline" size="sm" className="gap-1">
                  {tCategories("viewAllCategories")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== MAIN LAYOUT ===== */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0 border-e sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          {categoriesSidebar}
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed start-0 top-0 z-50 h-full w-72 bg-background border-e md:hidden overflow-y-auto">
              {categoriesSidebar}
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 min-w-0">
          {/* Breadcrumb / active filter */}
          {(selectedCategory || selectedSubcategory) && (
            <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
              <button
                onClick={() => { setSelectedCategory(""); setSelectedSubcategory("") }}
                className="text-muted-foreground hover:text-foreground"
              >
                {t("allProducts")}
              </button>
              {selectedCategory && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <button
                    onClick={() => { setSelectedSubcategory("") }}
                    className={selectedSubcategory ? "text-muted-foreground hover:text-foreground" : "font-medium"}
                  >
                    {translateCat(selectedCategory)}
                  </button>
                </>
              )}
              {selectedSubcategory && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{translateCat(selectedSubcategory)}</span>
                </>
              )}
            </div>
          )}

          {/* Product grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-2 md:gap-3">
              {filteredProducts.map((product) => (
                  <Card key={product.id} className="group hover:shadow-md transition-all">
                    <CardContent className="p-0">
                      <Link href={isLoggedIn && userRole === "buyer" ? `/buyer/product/${product.id}` : `/product/${product.id}`}>
                        <div className="aspect-square relative bg-card rounded-t-xl flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-contain"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
                            />
                          ) : (
                            <Package className="h-10 w-10 text-muted-foreground/30" />
                          )}
                        </div>
                      </Link>
                      <div className="p-3">
                        <Badge variant="secondary" className="text-xs mb-1">{product.category}</Badge>
                        <Link href={isLoggedIn && userRole === "buyer" ? `/buyer/product/${product.id}` : `/product/${product.id}`}>
                          <h3 className="font-semibold text-sm line-clamp-1 hover:underline">{product.name}</h3>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">{product.model_number}</p>
                        <p className="font-bold text-primary text-sm mt-2">
                          {formatDualPrice(product.price_per_meter, product.price_cny ?? null, product.pricing_type ?? "standard", rate)}
                        </p>
                        <Button
                          size="sm"
                          variant={addedIds.has(product.id) ? "default" : "outline"}
                          className="w-full mt-2 text-xs h-8"
                          onClick={() => handleAddToCart(product.id)}
                          disabled={addingIds.has(product.id) || product.stock <= 0}
                        >
                          {addingIds.has(product.id) ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : product.stock <= 0 ? (
                            tCart("outOfStock")
                          ) : addedIds.has(product.id) ? (
                            <><Check className="h-3 w-3 mr-1" />{tCart("addedToCart")}</>
                          ) : (
                            <><ShoppingCart className="h-3 w-3 mr-1" />{t("addToCart")}</>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <EmptyState icon={Package} title={t("noProducts")} description={t("noProductsDesc")} />
          )}
        </main>
      </div>

      {/* Sticky cart button for logged-in buyers */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-primary px-6 py-3 shadow-lg text-primary-foreground">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-medium">{cartCount} {cartCount === 1 ? tCommon("item") : tCommon("items")}</span>
          <Link href="/buyer/cart">
            <Button size="sm" variant="secondary" className="rounded-full font-semibold">
              {t("viewCart")}
            </Button>
          </Link>
        </div>
      )}

      {/* Sign In Dialog (for unauthenticated add-to-cart) */}
      <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("signInRequired")}</DialogTitle>
            <DialogDescription>{t("signInRequiredDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowSignInDialog(false)}>
              {tCommon("cancel")}
            </Button>
            <Link href="/sign-in">
              <Button variant="outline" className="w-full sm:w-auto">
                {tNav("logIn")}
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="w-full sm:w-auto">
                {tNav("signUpFree")}
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
