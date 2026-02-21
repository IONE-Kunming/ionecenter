"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"

export default function SellerProfilePage() {
  const [saving, setSaving] = useState(false)
  const handleSave = async () => { setSaving(true); await new Promise((r) => setTimeout(r, 1000)); setSaving(false) }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Display Name</Label><Input defaultValue="Zhang Wei" /></div>
            <div className="space-y-2"><Label>Company</Label><Input defaultValue="Kunming Aluminum Co." /></div>
          </div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" defaultValue="seller@ione.live" disabled /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Phone Number</Label><Input defaultValue="+86-987-6543-2101" /></div>
            <div className="space-y-2"><Label>Language</Label><Select defaultValue="zh" options={[{ value: "en", label: "English" }, { value: "zh", label: "Chinese" }, { value: "ar", label: "Arabic" }, { value: "ur", label: "Urdu" }]} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payment / Bank Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Bank Name</Label><Input defaultValue="Bank of China" /></div>
            <div className="space-y-2"><Label>Account Name</Label><Input defaultValue="Kunming Aluminum Co." /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Account / IBAN Number</Label><Input defaultValue="6228 4800 1234 5678 901" /></div>
            <div className="space-y-2"><Label>SWIFT Code</Label><Input defaultValue="BKCHCNBJ" /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Bank Branch</Label><Input defaultValue="Kunming Main Branch" /></div>
            <div className="space-y-2"><Label>Currency</Label><Select defaultValue="CNY" options={[{ value: "USD", label: "USD" }, { value: "CNY", label: "CNY" }, { value: "EUR", label: "EUR" }, { value: "GBP", label: "GBP" }, { value: "AED", label: "AED" }, { value: "SAR", label: "SAR" }, { value: "PKR", label: "PKR" }]} /></div>
          </div>
          <div className="space-y-2"><Label>Payment Notes</Label><Textarea placeholder="Additional payment instructions..." rows={3} /></div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
    </div>
  )
}
