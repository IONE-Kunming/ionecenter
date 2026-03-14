"use client"

import { useState, useMemo, useTransition, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import Link from "@/components/ui/link"
import Image from "next/image"
import {
  Package, Search, ShoppingCart, Check, Loader2, X, ArrowRight, ChevronLeft, MapPin,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDualPrice } from "@/lib/utils"
import { useExchangeRate } from "@/lib/use-exchange-rate"
import { addToCart } from "@/lib/actions/cart"
import type { CategoryData } from "@/lib/categories"
import { toCategoryKey } from "@/lib/categories"
import type { PricingType } from "@/types/database"

/* ───────── Types ───────── */

interface FinderProduct {
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
  seller_name?: string | null
}

export interface SmartProductFinderProps {
  products: FinderProduct[]
  categoryData: CategoryData
  isLoggedIn: boolean
  userRole: string | null
}

/* ───────── Component ───────── */

export function SmartProductFinder({
  products,
  categoryData,
  isLoggedIn,
  userRole,
}: SmartProductFinderProps) {
  const t = useTranslations("productFinder")
  const tNav = useTranslations("nav")
  const tCommon = useTranslations("common")
  const tCart = useTranslations("cart")
  const tCatNames = useTranslations("categoryNames")
  const { rate } = useExchangeRate()

  /* ── Wizard state ── */
  const [wizardOpen, setWizardOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedField, setSelectedField] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [region, setRegion] = useState("")

  /* ── Results state ── */
  const [showResults, setShowResults] = useState(false)

  /* ── Cart / sign-in state ── */
  const [, startTransition] = useTransition()
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [showSignInDialog, setShowSignInDialog] = useState(false)

  /* ── Helpers ── */
  const translateCat = (name: string): string => {
    const key = toCategoryKey(name)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translated = (tCatNames as any)(key)
    return typeof translated === "string" && translated !== key ? translated : name
  }

  /* ── Perform add-to-cart (extracted for reuse by auto-trigger) ── */
  const performAddToCart = useCallback((productId: string) => {
    if (addingIds.has(productId)) return
    setAddingIds((prev) => new Set(prev).add(productId))
    startTransition(async () => {
      try {
        const result = await addToCart(productId, 1)
        if (!result.error) {
          setAddedIds((prev) => new Set(prev).add(productId))
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Auto-trigger pending action after login ── */
  useEffect(() => {
    if (!isLoggedIn || userRole !== "buyer") return
    try {
      const raw = localStorage.getItem("smartFinderPendingAction")
      if (!raw) return
      const saved = JSON.parse(raw) as { productId: string; action: string }
      localStorage.removeItem("smartFinderPendingAction")
      if (saved.action === "addToCart" && saved.productId) {
        performAddToCart(saved.productId)
      }
    } catch {
      // ignore parse errors
    }
  }, [isLoggedIn, userRole, performAddToCart])

  const subcategories = useMemo(
    () => (selectedField ? categoryData.categoryMap[selectedField] ?? [] : []),
    [selectedField, categoryData.categoryMap],
  )

  const matchingProducts = useMemo(() => {
    if (!selectedField) return []
    return products.filter((p) => {
      const matchesCategory = p.main_category === selectedField
      const matchesSubcategory = !selectedType || p.category === selectedType
      return matchesCategory && matchesSubcategory
    })
  }, [products, selectedField, selectedType])

  /* ── Wizard navigation ── */
  const resetWizard = () => {
    setStep(1)
    setSelectedField("")
    setSelectedType("")
    setRegion("")
  }

  const openWizard = () => {
    resetWizard()
    setShowResults(false)
    setWizardOpen(true)
  }

  const handleFindProducts = () => {
    setWizardOpen(false)
    setShowResults(true)
  }

  const handleTryAgain = () => {
    setShowResults(false)
    openWizard()
  }

  const handleCloseResults = () => {
    setShowResults(false)
  }

  /* ── Cart actions ── */
  const handleAddToCart = (productId: string) => {
    if (!isLoggedIn || userRole !== "buyer") {
      try {
        localStorage.setItem("smartFinderPendingAction", JSON.stringify({ productId, action: "addToCart" }))
      } catch {
        // localStorage may be unavailable
      }
      setShowSignInDialog(true)
      return
    }
    performAddToCart(productId)
  }

  /* Build sign-in redirect URL — return to /about so auto-trigger can fire */
  const getSignInUrl = () => {
    return `/sign-in?redirect_url=${encodeURIComponent("/about")}`
  }

  const getSignUpUrl = () => {
    return `/sign-up?redirect_url=${encodeURIComponent("/about")}`
  }

  /* ── Wizard step content ── */
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("step1Desc")}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[340px] overflow-y-auto">
              {categoryData.mainCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedField(cat); setSelectedType(""); setStep(2) }}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center text-sm transition-all hover:border-primary hover:bg-primary/5 ${
                    selectedField === cat ? "border-primary bg-primary/10 font-medium" : "border-border"
                  }`}
                >
                  {categoryData.categoryImageMap[cat] ? (
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden">
                      <Image
                        src={categoryData.categoryImageMap[cat]!}
                        alt={translateCat(cat)}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <span className="line-clamp-2 leading-tight">{translateCat(cat)}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("step2Desc")}</p>
            {subcategories.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto">
                {subcategories.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => { setSelectedType(sub); setStep(3) }}
                    className={`rounded-xl border p-3 text-sm text-start transition-all hover:border-primary hover:bg-primary/5 ${
                      selectedType === sub ? "border-primary bg-primary/10 font-medium" : "border-border"
                    }`}
                  >
                    {translateCat(sub)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No subcategories available. Click Next to continue.
              </p>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("step3Desc")}</p>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder={t("regionPlaceholder")}
                className="pl-9"
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("step4Desc")}</p>
            <div className="rounded-xl border p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("businessField")}</span>
                <span className="font-medium">{translateCat(selectedField)}</span>
              </div>
              {selectedType && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("productType")}</span>
                  <span className="font-medium">{translateCat(selectedType)}</span>
                </div>
              )}
              {region && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("region")}</span>
                  <span className="font-medium">{region}</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">{t("matchingResults")}</span>
                <span className="font-medium text-primary">{matchingProducts.length}</span>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* ===== TEASER SECTION ===== */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="relative max-w-[1320px] mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Search className="h-5 w-5 text-primary" />
            <span className="text-[14px] uppercase tracking-[3px] text-primary font-medium">
              Smart Product Finder
            </span>
          </div>
          <h2 className="text-[28px] md:text-[40px] leading-[1.2] max-w-2xl mx-auto">
            {t("teaser")}
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
            {t("teaserDesc")}
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              onClick={openWizard}
              className="rounded-full px-8 py-4 text-base font-medium gap-2"
            >
              {t("startNow")} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ===== WIZARD DIALOG ===== */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>
                  {step === 1 && t("step1Title")}
                  {step === 2 && t("step2Title")}
                  {step === 3 && t("step3Title")}
                  {step === 4 && t("step4Title")}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {t("stepOf", { current: String(step), total: "4" })}
                </DialogDescription>
              </div>
              <button
                onClick={() => setWizardOpen(false)}
                className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Step indicator */}
            <div className="flex gap-1.5 mt-3">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    s <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </DialogHeader>

          <div className="mt-4 min-h-[200px]">
            {renderStepContent()}
          </div>

          <DialogFooter className="flex-row justify-between gap-2 mt-4">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1">
                <ChevronLeft className="h-4 w-4" /> {t("back")}
              </Button>
            ) : (
              <div />
            )}
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !selectedField}
              >
                {t("next")} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleFindProducts} className="gap-1">
                <Search className="h-4 w-4" /> {t("findProducts")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== RESULTS SECTION ===== */}
      {showResults && (
        <section className="py-12 md:py-16 border-b bg-background">
          <div className="max-w-[1320px] mx-auto px-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">{t("matchingResults")}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("matchingResultsDesc", { count: String(matchingProducts.length) })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleTryAgain}>
                  {t("tryAgain")}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCloseResults}>
                  {t("closeResults")}
                </Button>
              </div>
            </div>

            {matchingProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {matchingProducts.map((product) => (
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
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
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
                        {product.seller_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {t("seller")}: {product.seller_name}
                          </p>
                        )}
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
                            <><ShoppingCart className="h-3 w-3 mr-1" />{tCart("addToCart")}</>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title={t("noMatchingProducts")}
                description={t("noMatchingProductsDesc")}
              />
            )}
          </div>
        </section>
      )}

      {/* ===== SIGN-IN DIALOG ===== */}
      <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("signInToContinue")}</DialogTitle>
            <DialogDescription>{t("signInToContinueDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowSignInDialog(false)}>
              {tCommon("cancel")}
            </Button>
            <Link href={getSignInUrl()}>
              <Button variant="outline" className="w-full sm:w-auto">
                {tNav("logIn")}
              </Button>
            </Link>
            <Link href={getSignUpUrl()}>
              <Button className="w-full sm:w-auto">
                {tNav("signUpFree")}
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
