"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { updateUserProfile } from "@/lib/actions/users"
import type { User } from "@/types/database"

export default function SellerProfileForm({ user }: { user: User }) {
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
      currency,
      payment_notes: paymentNotes || null,
    })
    setSaving(false)
    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: "Profile saved successfully." })
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Display Name</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={user.email} disabled /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Phone Number</Label><Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /></div>
            <div className="space-y-2"><Label>Language</Label><Select value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)} options={[{ value: "en", label: "English" }, { value: "zh", label: "Chinese" }, { value: "ar", label: "Arabic" }, { value: "ur", label: "Urdu" }]} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payment / Bank Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Bank Name</Label><Input value={bankName} onChange={(e) => setBankName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Account Name</Label><Input value={accountName} onChange={(e) => setAccountName(e.target.value)} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Account / IBAN Number</Label><Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} /></div>
            <div className="space-y-2"><Label>SWIFT Code</Label><Input value={swiftCode} onChange={(e) => setSwiftCode(e.target.value)} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Bank Branch</Label><Input value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} /></div>
            <div className="space-y-2"><Label>Currency</Label><Select value={currency} onChange={(e) => setCurrency(e.target.value)} options={[{ value: "USD", label: "USD" }, { value: "CNY", label: "CNY" }, { value: "EUR", label: "EUR" }, { value: "GBP", label: "GBP" }, { value: "AED", label: "AED" }, { value: "SAR", label: "SAR" }, { value: "PKR", label: "PKR" }]} /></div>
          </div>
          <div className="space-y-2"><Label>Payment Notes</Label><Textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Additional payment instructions..." rows={3} /></div>
        </CardContent>
      </Card>

      {message && (
        <p className={message.type === "error" ? "text-sm text-red-600" : "text-sm text-green-600"}>
          {message.text}
        </p>
      )}

      <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
    </div>
  )
}
