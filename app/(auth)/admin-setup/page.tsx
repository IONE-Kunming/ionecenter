"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Shield, CheckCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function AdminSetupPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleSetup() {
    setStatus("loading")
    try {
      const res = await fetch("/api/admin-setup", { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        setStatus("error")
        setMessage(data.error || "Failed to create admin account")
        return
      }

      setStatus("success")
      setMessage("Admin account created successfully! Redirecting to dashboard...")
      setTimeout(() => router.push("/admin/dashboard"), 2000)
    } catch (err) {
      console.error("Admin setup failed:", err)
      setStatus("error")
      setMessage("Network error. Please try again.")
    }
  }

  if (!isLoaded) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Admin Setup</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            IONE Center Platform Administrator
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {user && (
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Signed in as:</span> {user.fullName || user.primaryEmailAddress?.emailAddress}</p>
                <p><span className="text-muted-foreground">Email:</span> {user.primaryEmailAddress?.emailAddress}</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                <CheckCircle className="h-4 w-4" />
                {message}
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                <AlertTriangle className="h-4 w-4" />
                {message}
              </div>
            )}

            <Button
              onClick={handleSetup}
              disabled={status === "loading" || status === "success"}
              className="w-full"
            >
              {status === "loading" ? "Creating Admin Account..." : status === "success" ? "Account Created ✓" : "Create Admin Account"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              This will promote your current account to admin. Only works if no admin account exists yet.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
