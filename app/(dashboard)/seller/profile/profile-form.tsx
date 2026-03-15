"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Copy, Check, Users, Search, Mail, Hash, ShoppingCart, Upload, ImageIcon, Trash2, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { toCategoryKey } from "@/lib/categories"
import { updateUserProfile, updateSellerMainCategory, createSellerLogoSignedUploadUrl, finalizeSellerLogoUpload, deleteSellerLogo } from "@/lib/actions/users"
import { getSellerBuyers, type SellerBuyer } from "@/lib/actions/orders"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/types/database"

export default function SellerProfileForm({ user, sellerCode, mainCategories, currentMainCategory }: { user: User; sellerCode: string | null; mainCategories: string[]; currentMainCategory: string | null }) {
  const t = useTranslations("profile")
  const tCommon = useTranslations("common")
  const tCatNames = useTranslations("categoryNames")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showBuyers, setShowBuyers] = useState(false)
  const [buyers, setBuyers] = useState<SellerBuyer[]>([])
  const [buyersLoading, setBuyersLoading] = useState(false)
  const [buyerSearch, setBuyerSearch] = useState("")
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>(currentMainCategory ?? "")
  const [categorySaving, setCategorySaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(user.logo_url ?? null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoDeleting, setLogoDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!showLightbox) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLightbox(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [showLightbox])

  useEffect(() => {
    if (showBuyers && buyers.length === 0) {
      setBuyersLoading(true)
      getSellerBuyers()
        .then((data) => setBuyers(data))
        .catch(() => {})
        .finally(() => setBuyersLoading(false))
    }
  }, [showBuyers, buyers.length])

  const filteredBuyers = useMemo(() => {
    if (!buyerSearch.trim()) return buyers
    const q = buyerSearch.toLowerCase()
    return buyers.filter(
      (b) =>
        b.display_name.toLowerCase().includes(q) ||
        (b.user_code && b.user_code.toLowerCase().includes(q)) ||
        b.email.toLowerCase().includes(q)
    )
  }, [buyers, buyerSearch])

  const handleCopyCode = async () => {
    if (!sellerCode) return
    try {
      await navigator.clipboard.writeText(sellerCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: ignore if clipboard access is unavailable
    }
  }

  const [displayName, setDisplayName] = useState(user.display_name)
  const [company, setCompany] = useState(user.company ?? "")
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number ?? "")
  const [preferredLanguage, setPreferredLanguage] = useState(user.preferred_language)

  const [bankName, setBankName] = useState(user.bank_name ?? "")
  const [accountName, setAccountName] = useState(user.account_name ?? "")
  const [accountNumber, setAccountNumber] = useState(user.account_number ?? "")
  const [swiftCode, setSwiftCode] = useState(user.swift_code ?? "")
  const [bankBranch, setBankBranch] = useState(user.bank_branch ?? "")
  const [bankRegion, setBankRegion] = useState(user.bank_region ?? "")
  const [bankCode, setBankCode] = useState(user.bank_code ?? "")
  const [branchCode, setBranchCode] = useState(user.branch_code ?? "")
  const [bankAddress, setBankAddress] = useState(user.bank_address ?? "")
  const [currency, setCurrency] = useState(user.currency)
  const [paymentNotes, setPaymentNotes] = useState(user.payment_notes ?? "")

  const translateCat = (name: string): string => {
    const key = toCategoryKey(name)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translated = (tCatNames as any)(key)
    return typeof translated === "string" && translated !== key ? translated : name
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    setMessage(null)
    try {
      const ext = file.name.split(".").pop() || "png"
      const signedResult = await createSellerLogoSignedUploadUrl(ext)
      if (signedResult.error) {
        setMessage({ type: "error", text: signedResult.error })
        setLogoUploading(false)
        if (logoInputRef.current) logoInputRef.current.value = ""
        return
      }

      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .uploadToSignedUrl(signedResult.path ?? "", signedResult.token ?? "", file, {
          contentType: file.type || "image/png",
        })

      if (uploadError) {
        setMessage({ type: "error", text: uploadError.message })
        setLogoUploading(false)
        if (logoInputRef.current) logoInputRef.current.value = ""
        return
      }

      const finalResult = await finalizeSellerLogoUpload(signedResult.filePath ?? "")
      if (finalResult.error) {
        setMessage({ type: "error", text: finalResult.error })
      } else if (finalResult.url) {
        setLogoUrl(`${finalResult.url}?t=${Date.now()}`)
        setMessage({ type: "success", text: t("logoUploaded") })
      }
    } catch {
      setMessage({ type: "error", text: t("logoUploadFailed") })
    }
    setLogoUploading(false)
    if (logoInputRef.current) logoInputRef.current.value = ""
  }

  const handleLogoDelete = async () => {
    setShowDeleteConfirm(false)
    setLogoDeleting(true)
    setMessage(null)
    try {
      const result = await deleteSellerLogo()
      if (result.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        setLogoUrl(null)
        setMessage({ type: "success", text: t("logoDeleted") })
      }
    } catch {
      setMessage({ type: "error", text: t("logoDeleteFailed") })
    }
    setLogoDeleting(false)
  }

  const handleCategoryChange = async (value: string) => {
    const newCategory = value || null
    setSelectedMainCategory(value)
    setCategorySaving(true)
    setMessage(null)
    const result = await updateSellerMainCategory(newCategory)
    setCategorySaving(false)
    if (result.error) {
      setMessage({ type: "error", text: result.error })
      setSelectedMainCategory(currentMainCategory ?? "")
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    const result = await updateUserProfile({
      display_name: displayName,
      company: company || null,
      phone_number: phoneNumber || null,
      preferred_language: preferredLanguage,
      bank_name: bankName || null,
      account_name: accountName || null,
      account_number: accountNumber || null,
      swift_code: swiftCode || null,
      bank_branch: bankBranch || null,
      bank_region: bankRegion || null,
      bank_code: bankCode || null,
      branch_code: branchCode || null,
      bank_address: bankAddress || null,
      currency,
      payment_notes: paymentNotes || null,
    })
    setSaving(false)
    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: tCommon("profileSaved") })
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {sellerCode && (
        <div className="grid sm:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>{t("yourSellerCode")}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-md bg-primary/10 px-4 py-2 text-2xl font-bold font-mono tracking-widest text-primary" aria-label={`${t("yourSellerCode")}: ${sellerCode}`}>
                  {sellerCode}
                </span>
                <Button variant="outline" size="icon" onClick={handleCopyCode} title={t("copyCode")}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" onClick={() => setShowBuyers(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  {t("myBuyers")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("sellerLogo")}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-lg border bg-muted flex items-center justify-center overflow-hidden shrink-0 group">
                  {logoUrl ? (
                    <>
                      <img
                        src={logoUrl}
                        alt={t("sellerLogo")}
                        className="h-full w-full object-contain cursor-pointer"
                        onClick={() => setShowLightbox(true)}
                      />
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true) }}
                        title={t("deleteLogo")}
                        disabled={logoDeleting}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logoUploading || logoDeleting}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {logoUploading || logoDeleting ? tCommon("saving") : t("uploadLogo")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showBuyers} onOpenChange={setShowBuyers}>
        <DialogContent className="sm:max-w-lg">
          <DialogClose onClick={() => setShowBuyers(false)} />
          <DialogHeader>
            <DialogTitle>{t("myBuyers")}</DialogTitle>
          </DialogHeader>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={buyerSearch}
              onChange={(e) => setBuyerSearch(e.target.value)}
              placeholder={t("searchBuyers")}
              className="pl-9"
            />
          </div>
          <div className="mt-3 max-h-80 overflow-y-auto space-y-2">
            {buyersLoading ? (
              <p className="text-sm text-muted-foreground text-center py-6">{tCommon("loading")}</p>
            ) : filteredBuyers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {buyers.length === 0 ? t("noBuyersYet") : t("noBuyersFound")}
              </p>
            ) : (
              filteredBuyers.map((b) => (
                <div key={b.buyer_id} className="rounded-lg border p-3 space-y-1">
                  <p className="font-medium">{b.display_name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {b.user_code && (
                      <span className="inline-flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {b.user_code}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {b.email}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      {b.order_count} {t("ordersCount")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete logo confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogClose onClick={() => setShowDeleteConfirm(false)} />
          <DialogHeader>
            <DialogTitle>{t("deleteLogo")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("deleteLogoConfirm")}</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
              {tCommon("cancel")}
            </Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleLogoDelete}>
              {t("deleteLogo")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox for full-size logo preview */}
      {showLightbox && logoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowLightbox(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
            onClick={() => setShowLightbox(false)}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={logoUrl}
            alt={t("sellerLogo")}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>{t("myCategory")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Label>{t("selectMainCategory")}</Label>
          <Select
            value={selectedMainCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            options={[
              { value: "", label: t("noCategorySelected") },
              ...mainCategories.map((cat) => ({ value: cat, label: translateCat(cat) })),
            ]}
          />
          {categorySaving && <p className="text-sm text-muted-foreground">{tCommon("saving")}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("personalInfo")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t("displayName")}</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
            <div className="space-y-2"><Label>{tCommon("company")}</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>{t("emailAddress")}</Label><Input type="email" value={user.email} disabled /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t("phoneNumber")}</Label><Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("language")}</Label><Select value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)} options={[{ value: "en", label: t("english") }, { value: "zh", label: t("chinese") }, { value: "ar", label: t("arabic") }, { value: "ur", label: t("urdu") }]} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("paymentBankDetails")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t("accountName")}</Label><Input value={accountName} onChange={(e) => setAccountName(e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("accountNumber")}</Label><Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t("swiftCode")}</Label><Input value={swiftCode} onChange={(e) => setSwiftCode(e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("bankName")}</Label><Input value={bankName} onChange={(e) => setBankName(e.target.value)} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t("bankRegion")}</Label><Input value={bankRegion} onChange={(e) => setBankRegion(e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("bankCode")}</Label><Input value={bankCode} onChange={(e) => setBankCode(e.target.value)} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t("branchCode")}</Label><Input value={branchCode} onChange={(e) => setBranchCode(e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("bankBranch")}</Label><Input value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>{t("bankAddress")}</Label><Input value={bankAddress} onChange={(e) => setBankAddress(e.target.value)} /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t("currency")}</Label><Select value={currency} onChange={(e) => setCurrency(e.target.value)} options={[{ value: "USD", label: "USD" }, { value: "CNY", label: "CNY" }, { value: "EUR", label: "EUR" }, { value: "GBP", label: "GBP" }, { value: "AED", label: "AED" }, { value: "SAR", label: "SAR" }, { value: "PKR", label: "PKR" }]} /></div>
          </div>
          <div className="space-y-2"><Label>{t("paymentNotes")}</Label><Textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder={t("paymentNotesPlaceholder")} rows={3} /></div>
        </CardContent>
      </Card>

      {message && (
        <p className={message.type === "error" ? "text-sm text-red-600" : "text-sm text-green-600"}>
          {message.text}
        </p>
      )}

      <Button onClick={handleSave} disabled={saving}>{saving ? tCommon("saving") : t("saveChanges")}</Button>
    </div>
  )
}
