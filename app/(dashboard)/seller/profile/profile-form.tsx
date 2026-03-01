"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { useTranslations } from "next-intl"
import { updateUserProfile } from "@/lib/actions/users"
import type { User } from "@/types/database"

export default function SellerProfileForm({ user }: { user: User }) {
  const t = useTranslations("profile")
  const tCommon = useTranslations("common")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

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
