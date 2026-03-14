"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, Plus, Search, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { usePageTitle } from "./page-title-context"
import { useProductsPageHeader } from "./products-page-context"
import { usePreviewSearch } from "./preview-search-context"
import { useCategoriesSearch } from "./categories-search-context"
import { ProductSearchDropdown } from "@/components/product-search-dropdown"

export function DashboardHeader() {
  const { pageTitle } = usePageTitle()
  const productsCtx = useProductsPageHeader()
  const pathname = usePathname()
  const router = useRouter()
  const tCommon = useTranslations("common")
  const t = useTranslations("sellerProducts")
  const tBulk = useTranslations("bulkEdit")
  const tProductDetail = useTranslations("productDetail")
  const tInvoices = useTranslations("invoices")
  const tPackingLists = useTranslations("packingLists")
  const tOrders = useTranslations("orders")
  const parts = pathname.split("/").filter(Boolean)

  // Detect product detail page pattern: /buyer/product/[id] or /seller/product/[id]
  const isProductDetailPage = parts.length >= 3 && parts[1] === "product"

  // Detect offline invoice detail page: /seller/invoices/offline/[id]
  const isOfflineInvoiceDetailPage = parts.length >= 4 && parts[1] === "invoices" && parts[2] === "offline"

  // Detect invoice detail page: /seller/invoices/[id] or /buyer/invoices/[id]
  const isInvoiceDetailPage = parts.length === 3 && parts[1] === "invoices" && parts[2] !== "create" && parts[2] !== "offline"

  // Detect packing list detail page: /seller/packing-lists/[id]
  const isPackingListDetailPage = parts.length === 3 && parts[1] === "packing-lists" && parts[2] !== "create"

  // Detect order detail page: /seller/orders/[id] or /buyer/orders/[id]
  const isOrderDetailPage = parts.length === 3 && parts[1] === "orders" && parts[2] !== "create"

  const fallbackTitle = isProductDetailPage
    ? tProductDetail("title")
    : isOfflineInvoiceDetailPage || isInvoiceDetailPage
    ? tInvoices("invoiceDetails")
    : isPackingListDetailPage
    ? tPackingLists("packingList")
    : isOrderDetailPage
    ? tOrders("orderDetails")
    : parts[parts.length - 1]
        ?.replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()) || "Dashboard"

  const title = pageTitle || fallbackTitle

  const previewCtx = usePreviewSearch()
  const categoriesCtx = useCategoriesSearch()
  const [searchQuery, setSearchQuery] = useState("")

  const role = parts[0] === "buyer" ? "buyer" : parts[0] === "seller" ? "seller" : "admin"

  const getSearchPath = () => {
    if (role === "buyer") return "/"
    if (role === "seller") return "/seller/products"
    return "/admin/products"
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (previewCtx.isPreviewPage) return
    if (categoriesCtx.isCategoriesPage) return
    if (!searchQuery.trim()) return
    router.push(`${getSearchPath()}?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (previewCtx.isPreviewPage) {
      previewCtx.setSearch(value)
    }
    if (categoriesCtx.isCategoriesPage) {
      categoriesCtx.setSearch(value)
    }
  }

  const showProductsHeader = productsCtx.isProductsPage
  const isBulkEditPage = parts.length >= 2 && parts[1] === "bulk-edit"

  return (
    <header className="sticky top-0 z-30 border-b bg-background px-6 py-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold flex-shrink-0">{title}</h1>
        {showProductsHeader ? (
          <>
            <ProductSearchDropdown
              value={productsCtx.search}
              onChange={(v) => productsCtx.setSearch(v)}
              products={productsCtx.products}
              placeholder={tCommon("searchProducts")}
              className="flex-1 max-w-md ml-4"
              onItemClick={productsCtx.onProductClick ?? undefined}
            />
            {productsCtx.onAddProduct && (
              <Button onClick={productsCtx.onAddProduct} className="gap-2 flex-shrink-0">
                <Plus className="h-4 w-4" /> {t("addProduct")}
              </Button>
            )}
            {productsCtx.onBulkImport && (
              <Button variant="outline" onClick={productsCtx.onBulkImport} className="gap-2 flex-shrink-0">
                <Upload className="h-4 w-4" /> {tBulk("bulkImport")}
              </Button>
            )}
          </>
        ) : !isBulkEditPage ? (
          <form onSubmit={handleSearch} className="flex-1 max-w-md ml-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={tCommon("searchAll")}
                className="pl-9 h-9"
              />
            </div>
          </form>
        ) : null}
      </div>
    </header>
  )
}
