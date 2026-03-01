"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Copy, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { updateUserProfile } from "@/lib/actions/users"
import type { User } from "@/types/database"

export default function BuyerProfileForm({ user }: { user: User }) {
  const t = useTranslations("profile")
  const tCommon = useTranslations("common")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopyCode = async () => {
    if (!user.user_code) return
    await navigator.clipboard.writeText(user.user_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const [displayName, setDisplayName] = useState(user.display_name)
  const [company, setCompany] = useState(user.company ?? "")
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number ?? "")
  const [preferredLanguage, setPreferredLanguage] = useState(user.preferred_language)
  const [street, setStreet] = useState(user.street ?? "")
  const [city, setCity] = useState(user.city ?? "")
  const [state, setState] = useState(user.state ?? "")
  const [zip, setZip] = useState(user.zip ?? "")
  const [country, setCountry] = useState(user.country ?? "")

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    const result = await updateUserProfile({
      display_name: displayName,
      company: company || null,
      phone_number: phoneNumber || null,
      preferred_language: preferredLanguage,
      street: street || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      country: country || null,
    })
    setSaving(false)
    if (result.error) {
      setMessage({ type: "error", text: tCommon("saveFailed") })
    } else {
      setMessage({ type: "success", text: tCommon("profileSaved") })
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {user.user_code && (
        <Card>
          <CardHeader><CardTitle>{t("yourBuyerCode")}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-md bg-primary/10 px-4 py-2 text-2xl font-bold font-mono tracking-widest text-primary">
                {user.user_code}
              </span>
              <Button variant="outline" size="icon" onClick={handleCopyCode} title={t("copyCode")}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>{t("personalInfo")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("displayName")}</Label>
              <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">{tCommon("company")}</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("emailAddress")}</Label>
            <Input id="email" type="email" value={user.email} disabled />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phoneNumber")}</Label>
              <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t("preferredLanguage")}</Label>
              <Select id="language" value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)} options={[
                { value: "en", label: t("english") }, { value: "zh", label: t("chinese") },
                { value: "ar", label: t("arabic") }, { value: "ur", label: t("urdu") },
              ]} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("address")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">{t("street")}</Label>
            <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">{t("city")}</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">{t("state")}</Label>
              <Input id="state" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">{t("zip")}</Label>
              <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">{t("country")}</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {message && (
        <p className={message.type === "error" ? "text-sm text-red-600" : "text-sm text-green-600"}>
          {message.text}
        </p>
      )}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? tCommon("saving") : t("saveChanges")}
      </Button>
    </div>
  )
}
