"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function DashboardHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const parts = pathname.split("/").filter(Boolean)
  const title = parts[parts.length - 1]
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Dashboard"

  const [searchQuery, setSearchQuery] = useState("")

  const role = parts[0] === "buyer" ? "buyer" : parts[0] === "seller" ? "seller" : "admin"

  const getSearchPath = () => {
    if (role === "buyer") return "/buyer/all-products"
    if (role === "seller") return "/seller/products"
    return "/admin/products"
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`${getSearchPath()}?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <header className="border-b bg-background px-6 py-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold flex-shrink-0">{title}</h1>
        <form onSubmit={handleSearch} className="flex-1 max-w-md ml-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, categories..."
              className="pl-9 h-9"
            />
          </div>
        </form>
      </div>
    </header>
  )
}
