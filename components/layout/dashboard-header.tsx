"use client"

import { usePathname } from "next/navigation"
import { Breadcrumb } from "@/components/layout/breadcrumb"

export function DashboardHeader() {
  const pathname = usePathname()
  const parts = pathname.split("/").filter(Boolean)
  const title = parts[parts.length - 1]
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Dashboard"

  return (
    <header className="border-b bg-background px-6 py-4">
      <Breadcrumb />
      <h1 className="text-2xl font-bold mt-1">{title}</h1>
    </header>
  )
}
