"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  ArrowLeft, User, LogOut, ShoppingCart, Heart, FileText,
  Receipt, FileSignature, MessageSquare, HelpCircle, Home, Search,
  Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import Link from "@/components/ui/link"
import { useUser, useClerk } from "@clerk/nextjs"
import { usePageTitle } from "./page-title-context"

export function BuyerDashboardHeader() {
  const { pageTitle } = usePageTitle()
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useClerk()
  const tCommon = useTranslations("common")
  const tProfile = useTranslations("profileMenu")
  const tSidebar = useTranslations("sidebar")

  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const parts = pathname.split("/").filter(Boolean)
  const isProductDetailPage = parts.length >= 3 && parts[1] === "product"

  const fallbackTitle = isProductDetailPage
    ? "Product"
    : parts[parts.length - 1]?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Dashboard"

  const title = pageTitle || fallbackTitle

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  const menuItems = [
    { label: tProfile("home"), href: "/", icon: Home },
    { label: tSidebar("orders"), href: "/buyer/orders", icon: FileText },
    { label: tSidebar("cart"), href: "/buyer/cart", icon: ShoppingCart },
    { label: tSidebar("myList"), href: "/buyer/my-list", icon: Heart },
    { label: tSidebar("invoices"), href: "/buyer/invoices", icon: Receipt },
    { label: tSidebar("contracts"), href: "/buyer/contracts", icon: FileSignature },
    { label: tSidebar("chats"), href: "/buyer/chats", icon: MessageSquare },
    { label: tSidebar("notifications"), href: "/buyer/notifications", icon: Bell },
    { label: tSidebar("support"), href: "/buyer/support", icon: HelpCircle },
    { label: tSidebar("profile"), href: "/buyer/profile", icon: User },
  ]

  return (
    <header className="sticky top-0 z-30 border-b bg-background px-4 md:px-6 py-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="h-8 w-8 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold flex-shrink-0 hidden sm:block">{title}</h1>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tCommon("searchAll")}
              className="pl-9 h-9 rounded-full"
            />
          </div>
        </form>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Profile icon */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-full p-1 hover:bg-accent transition-colors"
          >
            <Avatar
              src={user?.imageUrl}
              alt={user?.fullName || "User"}
              fallback={(user?.fullName || "U").charAt(0)}
              size="sm"
            />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute end-0 top-10 z-50 w-52 rounded-xl border bg-background shadow-lg py-1">
                <div className="px-4 py-2.5 border-b">
                  <p className="text-sm font-medium truncate">{user?.fullName || "User"}</p>
                  <p className="text-xs text-muted-foreground">{tSidebar("role_buyer")}</p>
                </div>
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </Link>
                ))}
                <div className="border-t mt-1">
                  <button
                    onClick={() => signOut({ redirectUrl: "/" })}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {tProfile("signOut")}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
