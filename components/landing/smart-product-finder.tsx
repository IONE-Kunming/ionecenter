"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import Image from "next/image"
import {
  Package, Search, X, ArrowRight, ChevronLeft, MapPin, Check, ChevronsUpDown, CheckCircle2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import type { CategoryData } from "@/lib/categories"
import { toCategoryKey } from "@/lib/categories"
import type { PricingType } from "@/types/database"
import { COUNTRIES } from "@/lib/countries"

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

/* ───────── Country Dropdown ───────── */

function CountryDropdown({
  value,
  placeholder,
  onSelect,
}: {
  value: string
  placeholder: string
  onSelect: (country: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(
    () =>
      search
        ? COUNTRIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
        : COUNTRIES,
    [search],
  )

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSelect = useCallback(
    (country: string) => {
      setSearch("")
      setOpen(false)
      onSelect(country)
    },
    [onSelect],
  )

  return (
    <div ref={containerRef} className="relative">
      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        value={open ? search : value}
        onChange={(e) => { setSearch(e.target.value); if (!open) setOpen(true) }}
        onFocus={() => { setOpen(true); setSearch("") }}
        placeholder={placeholder}
        className="pl-9 pr-9"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        onClick={() => { setOpen(!open); if (!open) inputRef.current?.focus() }}
        tabIndex={-1}
      >
        <ChevronsUpDown className="h-4 w-4" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-[200px] overflow-y-auto rounded-xl border bg-popover shadow-md"
        >
          {filtered.length > 0 ? (
            filtered.map((country) => (
              <li key={country} role="option" aria-selected={value === country}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                    value === country ? "bg-accent/50 font-medium" : ""
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(country)}
                >
                  {value === country && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  <span className={value !== country ? "pl-[22px]" : ""}>{country}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No country found.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

/* ───────── Component ───────── */

export function SmartProductFinder({
  products,
  categoryData,
}: SmartProductFinderProps) {
  const t = useTranslations("productFinder")
  const tCatNames = useTranslations("categoryNames")
  const router = useRouter()

  /* ── Wizard state ── */
  const [wizardOpen, setWizardOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedField, setSelectedField] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [region, setRegion] = useState("")

  /* ── Helpers ── */
  const translateCat = (name: string): string => {
    const key = toCategoryKey(name)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translated = (tCatNames as any)(key)
    return typeof translated === "string" && translated !== key ? translated : name
  }

  const subcategories = useMemo(
    () => (selectedField ? categoryData.categoryMap[selectedField] ?? [] : []),
    [selectedField, categoryData.categoryMap],
  )

  const matchingProducts = useMemo(() => {
    if (!selectedField) return []
    return products.filter((p) => {
      const matchesCategory = p.main_category === selectedField
      const matchesSubcategory = selectedTypes.length === 0 || selectedTypes.includes(p.category)
      return matchesCategory && matchesSubcategory
    })
  }, [products, selectedField, selectedTypes])

  /* ── Wizard navigation ── */
  const resetWizard = () => {
    setStep(1)
    setSelectedField("")
    setSelectedTypes([])
    setRegion("")
  }

  const openWizard = () => {
    resetWizard()
    setWizardOpen(true)
  }

  const handleFindProducts = () => {
    setWizardOpen(false)
    const params = new URLSearchParams()
    if (selectedField) params.set("category", selectedField)
    if (selectedTypes.length > 0) params.set("subcategory", selectedTypes.join(","))
    if (region) params.set("region", region)
    router.push(`/guest/finder-results?${params.toString()}`)
  }

  /* ── Wizard step content ── */
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("step1Desc")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto pr-1">
              {categoryData.mainCategories.map((cat) => {
                const subs = categoryData.categoryMap[cat] ?? []
                const imageUrl = categoryData.categoryImageMap[cat] ?? null
                return (
                  <Card
                    key={cat}
                    onClick={() => { setSelectedField(cat); setSelectedTypes([]); setStep(2) }}
                    className={`cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden ${
                      selectedField === cat ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <CardContent className="p-0 relative">
                      {imageUrl ? (
                        <div className="relative h-[140px]">
                          <Image
                            src={imageUrl}
                            alt={translateCat(cat)}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-3 left-4 right-4">
                            <h3 className="font-semibold text-white text-sm">{translateCat(cat)}</h3>
                            <p className="text-xs text-white/80">
                              {subs.length} {t("subcategories")}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <Package className="h-10 w-10 mx-auto text-primary" />
                          <h3 className="mt-3 font-semibold text-sm">{translateCat(cat)}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {subs.length} {t("subcategories")}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )

      case 2: {
        const allSelected = subcategories.length > 0 && selectedTypes.length === subcategories.length
        const toggleSubcategory = (sub: string) => {
          setSelectedTypes((prev) =>
            prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
          )
        }
        const toggleAll = () => {
          setSelectedTypes(allSelected ? [] : [...subcategories])
        }
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("step2Desc")}</p>
            {subcategories.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto">
                {/* All option */}
                <button
                  onClick={toggleAll}
                  className={`rounded-xl border p-3 text-sm text-start transition-all hover:border-primary hover:bg-primary/5 flex items-center gap-2 col-span-2 ${
                    allSelected ? "border-primary bg-primary/10 font-medium" : "border-border"
                  }`}
                >
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${allSelected ? "text-primary" : "text-muted-foreground"}`} />
                  {t("all")}
                </button>
                {subcategories.map((sub) => {
                  const isSelected = selectedTypes.includes(sub)
                  return (
                    <button
                      key={sub}
                      onClick={() => toggleSubcategory(sub)}
                      className={`rounded-xl border p-3 text-sm text-start transition-all hover:border-primary hover:bg-primary/5 flex items-center gap-2 ${
                        isSelected ? "border-primary bg-primary/10 font-medium" : "border-border"
                      }`}
                    >
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      {translateCat(sub)}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {t("noSubcategories")}
              </p>
            )}
          </div>
        )
      }

      case 3:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("step3Desc")}</p>
            <CountryDropdown
              value={region}
              placeholder={t("regionPlaceholder")}
              onSelect={(country) => { setRegion(country); setStep(4) }}
            />
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
              {selectedTypes.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("productType")}</span>
                  <span className="font-medium text-end">{selectedTypes.map(translateCat).join(", ")}</span>
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
              {t("label")}
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
        <DialogContent className="sm:max-w-5xl">
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
    </>
  )
}
