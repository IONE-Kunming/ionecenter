"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { HelpCircle, Mail } from "lucide-react"

export default function AdminSupportPage() {
  const [sending, setSending] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    const form = e.target as HTMLFormElement
    const subject = (form.elements.namedItem("subject") as HTMLInputElement)?.value
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement)?.value
    window.location.href = `mailto:contactus@ione.live?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
    setSending(false)
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5" /> Contact Support</CardTitle>
          <CardDescription>Submit a support request and our team will get back to you.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Issue Type</Label>
              <Select id="type" options={[
                { value: "order", label: "Order Issue" }, { value: "payment", label: "Payment Issue" },
                { value: "product", label: "Product Issue" }, { value: "account", label: "Account Issue" },
                { value: "other", label: "Other" },
              ]} placeholder="Select issue type" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" placeholder="Brief description of your issue" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" placeholder="Describe your issue in detail..." rows={5} required />
            </div>
            <Button type="submit" disabled={sending} className="gap-2">
              <Mail className="h-4 w-4" /> {sending ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
