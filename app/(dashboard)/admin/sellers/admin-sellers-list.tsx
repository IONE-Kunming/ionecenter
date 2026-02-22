"use client"

import { useState } from "react"
import { Store, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate } from "@/lib/utils"

interface SellerRow {
  id: string
  display_name: string
  email: string
  company: string | null
  phone_number: string | null
  city: string | null
  country: string | null
  product_count: number
  order_count: number
  created_at: string
}

export function AdminSellersList({ sellers }: { sellers: SellerRow[] }) {
  const t = useTranslations("adminSellers")
  const tCommon = useTranslations("common")
  const [search, setSearch] = useState("")

  const filtered = sellers.filter((s) => {
    const term = search.toLowerCase()
    if (!term) return true
    return (
      s.display_name.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      (s.company?.toLowerCase().includes(term) ?? false)
    )
  })

  const totalProducts = filtered.reduce((sum, s) => sum + s.product_count, 0)
  const totalOrders = filtered.reduce((sum, s) => sum + s.order_count, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Seller Management</h1>
        <p className="text-sm text-muted-foreground">Manage all sellers on the platform</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{filtered.length}</p>
          <p className="text-xs text-muted-foreground">{t("totalSellers")}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{totalProducts}</p>
          <p className="text-xs text-muted-foreground">{t("totalProducts")}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{totalOrders}</p>
          <p className="text-xs text-muted-foreground">{t("totalOrders")}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">
            <Badge variant="success">Active</Badge>
          </p>
          <p className="text-xs text-muted-foreground">{t("platformStatus")}</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tCommon("searchSellers")} className="pl-9" />
        </div>
      </div>

      {filtered.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon("company")}</TableHead>
                <TableHead>{t("contact")}</TableHead>
                <TableHead>{tCommon("email")}</TableHead>
                <TableHead>{tCommon("phone")}</TableHead>
                <TableHead className="text-right">{t("products")}</TableHead>
                <TableHead className="text-right">{t("orders")}</TableHead>
                <TableHead>{t("location")}</TableHead>
                <TableHead>{t("joined")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((seller) => (
                <TableRow key={seller.id}>
                  <TableCell className="font-medium">{seller.company ?? "—"}</TableCell>
                  <TableCell>{seller.display_name}</TableCell>
                  <TableCell className="text-muted-foreground">{seller.email}</TableCell>
                  <TableCell className="text-muted-foreground">{seller.phone_number ?? "—"}</TableCell>
                  <TableCell className="text-right">{seller.product_count}</TableCell>
                  <TableCell className="text-right">{seller.order_count}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {[seller.city, seller.country].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell>{formatDate(seller.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState icon={Store} title={t("noSellers")} description="No sellers match your search criteria." />
      )}
    </div>
  )
}
