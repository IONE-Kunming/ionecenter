"use client"

import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardHeader() {
  const pathname = usePathname()
  const parts = pathname.split("/").filter(Boolean)
  const title = parts[parts.length - 1]
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Dashboard"

  return (
    <header className="border-b bg-background px-6 py-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
    </header>
  )
}
