"use client"

import * as React from "react"
import Link from "@/components/ui/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useUser, useClerk } from "@clerk/nextjs"
import { useTranslations } from "next-intl"
import {
  LayoutDashboard, Package, ShoppingCart, FileText, Users, MessageSquare,
  Bell, Settings, HelpCircle, LogOut, ChevronDown, Sun, Moon, Menu, X,
  Building2, Pencil, DollarSign, BarChart3, Receipt, Calculator, Scale,
  Layers, Store, ClipboardList, Globe, Eye, FolderTree, Heart, Images
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/providers/theme-provider"
import { Avatar } from "@/components/ui/avatar"
import { LanguageSwitcher } from "@/components/language-switcher"
import type { UserRole } from "@/types/database"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  children?: NavItem[]
}

type TranslationFn = (key: string) => string

function getNavItems(role: UserRole, t: TranslationFn): NavItem[] {
  const financeItems: NavItem[] = [
    { label: t("financesDashboard"), href: "finances/dashboard", icon: DollarSign },
    { label: t("transactions"), href: "finances/transactions", icon: Receipt },
    { label: t("accounts"), href: "finances/accounts", icon: BarChart3 },
    { label: t("reports"), href: "finances/reports", icon: ClipboardList },
    { label: t("tax"), href: "finances/tax", icon: Calculator },
    { label: t("reconciliation"), href: "finances/reconciliation", icon: Scale },
  ]

  if (role === "buyer") {
    return [
      { label: t("dashboard"), href: "/buyer/dashboard", icon: LayoutDashboard },
      { label: t("catalog"), href: "/buyer/catalog", icon: Layers },
      { label: t("allProducts"), href: "/buyer/all-products", icon: Package },
      { label: t("myList"), href: "/buyer/my-list", icon: Heart },
      { label: t("cart"), href: "/buyer/cart", icon: ShoppingCart },
      { label: t("orders"), href: "/buyer/orders", icon: FileText },
      { label: t("invoices"), href: "/buyer/invoices", icon: Receipt },
      { label: t("sellers"), href: "/buyer/sellers", icon: Store },
      { label: t("chats"), href: "/buyer/chats", icon: MessageSquare },
      { label: t("notifications"), href: "/buyer/notifications", icon: Bell },
      {
        label: t("finances"),
        href: "/buyer/finances",
        icon: DollarSign,
        children: financeItems.map((item) => ({
          ...item,
          href: `/buyer/${item.href}`,
        })),
      },
      { label: t("support"), href: "/buyer/support", icon: HelpCircle },
      { label: t("profile"), href: "/buyer/profile", icon: Settings },
    ]
  }

  if (role === "seller") {
    return [
      { label: t("dashboard"), href: "/seller/dashboard", icon: LayoutDashboard },
      { label: t("products"), href: "/seller/products", icon: Package },
      { label: t("gallery"), href: "/seller/gallery", icon: Images },
      { label: t("myList"), href: "/seller/my-list", icon: Heart },
      { label: t("bulkEdit"), href: "/seller/bulk-edit", icon: Pencil },
      { label: t("orders"), href: "/seller/orders", icon: FileText },
      { label: t("invoices"), href: "/seller/invoices", icon: Receipt },
      { label: t("branches"), href: "/seller/branches", icon: Building2 },
      { label: t("chats"), href: "/seller/chats", icon: MessageSquare },
      { label: t("notifications"), href: "/seller/notifications", icon: Bell },
      {
        label: t("finances"),
        href: "/seller/finances",
        icon: DollarSign,
        children: financeItems.map((item) => ({
          ...item,
          href: `/seller/${item.href}`,
        })),
      },
      { label: t("support"), href: "/seller/support", icon: HelpCircle },
      { label: t("profile"), href: "/seller/profile", icon: Settings },
      { label: t("viewAsBuyer"), href: "/seller/preview", icon: Eye },
    ]
  }

  // Admin
  return [
    { label: t("dashboard"), href: "/admin/dashboard", icon: LayoutDashboard },
    { label: t("users"), href: "/admin/users", icon: Users },
    { label: t("products"), href: "/admin/products", icon: Package },
    { label: t("bulkEdit"), href: "/admin/bulk-edit", icon: Pencil },
    { label: t("categories"), href: "/admin/categories", icon: FolderTree },
    { label: t("orders"), href: "/admin/orders", icon: FileText },
    { label: t("invoices"), href: "/admin/invoices", icon: Receipt },
    { label: t("support"), href: "/admin/support", icon: HelpCircle },
    {
      label: t("finances"),
      href: "/admin/finances",
      icon: DollarSign,
      children: financeItems.map((item) => ({
        ...item,
        href: `/admin/${item.href}`,
      })),
    },
    { label: t("profile"), href: "/admin/profile", icon: Settings },
  ]
}

interface SidebarProps {
  role: UserRole
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { theme, setTheme } = useTheme()
  const t = useTranslations("sidebar")
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])
  const navItems = getNavItems(role, t)

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  // Auto-expand active finance section
  React.useEffect(() => {
    if (pathname.includes("/finances/")) {
      const financesLabel = t("finances")
      setExpandedItems((prev) => (prev.includes(financesLabel) ? prev : [...prev, financesLabel]))
    }
  }, [pathname, t])

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b px-6 py-4">
        <Image src="/logo.svg" alt="IONE Center" width={120} height={32} className="h-8 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleExpanded(item.label)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-black dark:text-white hover:bg-accent hover:text-foreground dark:hover:text-accent-foreground",
                      pathname.startsWith(item.href) && "bg-accent text-foreground dark:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 text-start">{item.label}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        expandedItems.includes(item.label) && "rotate-180"
                      )}
                    />
                  </button>
                  {expandedItems.includes(item.label) && (
                    <ul className="ml-4 mt-1 space-y-1 border-l pl-3">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-foreground dark:hover:text-accent-foreground",
                              pathname === child.href
                                ? "bg-accent font-medium text-foreground dark:text-accent-foreground"
                                : "text-black dark:text-white"
                            )}
                          >
                            <child.icon className="h-4 w-4" />
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground dark:hover:text-accent-foreground",
                    pathname === item.href
                      ? "bg-accent text-foreground dark:text-accent-foreground"
                      : "text-black dark:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t p-4 space-y-3">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? t("lightMode") : t("darkMode")}
        </button>

        {/* Language switcher */}
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span className="flex-1">{t("language")}</span>
          <LanguageSwitcher side="top" />
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 px-3">
          <Avatar
            src={user?.imageUrl}
            alt={user?.fullName || "User"}
            fallback={user?.fullName?.charAt(0)}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{t(`role_${role}`)}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t("signOut")}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 start-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed start-0 top-0 z-40 h-full w-64 border-e bg-sidebar text-sidebar-foreground transition-transform duration-200 md:translate-x-0 rtl:md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
