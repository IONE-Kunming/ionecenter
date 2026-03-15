"use client"

import { useState, useMemo } from "react"
import { Store, Search, Pencil, Trash2, Check, X, ChevronDown, ChevronRight, AlertTriangle, ImageIcon, ArrowRightLeft, Download, FileSpreadsheet, FileText, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { useFormatters } from "@/lib/use-formatters"
import { adminUpdateUser, adminDeleteUser, adminUpdateUserCode, adminUpdateSellerCategories, adminClearSellerCategories, adminDeleteProductsByRemovedCategories, adminGetSellerProductCount, adminTransferProducts, adminGetSellerProducts, adminCreateSeller, adminUpdateSellerClerk } from "@/lib/actions/admin"
import type { SellerWithDetails } from "@/lib/actions/admin"
import type { SiteCategory } from "@/lib/actions/site-settings"
import type { UserRole } from "@/types/database"

function roleBadgeVariant(role: UserRole) {
  if (role === "admin") return "destructive" as const
  if (role === "seller") return "warning" as const
  return "default" as const
}

export function AdminSellersList({ sellers, siteCategories }: { sellers: SellerWithDetails[]; siteCategories: SiteCategory[] }) {
  const t = useTranslations("adminSellers")
  const tCommon = useTranslations("common")
  const { formatDate } = useFormatters()
  const [search, setSearch] = useState("")
  const [expandedSellers, setExpandedSellers] = useState<Set<string>>(new Set())

  // Build category hierarchy from siteCategories
  const { mainCats, subCatMap } = useMemo(() => {
    const mains = siteCategories.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    const subs: Record<string, SiteCategory[]> = {}
    for (const main of mains) {
      subs[main.id] = siteCategories
        .filter((c) => c.parent_id === main.id)
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    }
    return { mainCats: mains, subCatMap: subs }
  }, [siteCategories])

  // Edit modal state
  const [editUser, setEditUser] = useState<SellerWithDetails | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState("")
  const [editCompany, setEditCompany] = useState("")
  const [editMainCategory, setEditMainCategory] = useState<string | null>(null)
  const [editSubcategories, setEditSubcategories] = useState<string[]>([])
  const [editSaving, setEditSaving] = useState(false)
  const [showCategoryWarning, setShowCategoryWarning] = useState(false)

  // Delete modal state
  const [deleteUser, setDeleteUser] = useState<SellerWithDetails | null>(null)
  const [deleting, setDeleting] = useState(false)

  // User code editing state
  const [editingCodeUserId, setEditingCodeUserId] = useState<string | null>(null)
  const [editingCodeValue, setEditingCodeValue] = useState("")
  const [codeSaving, setCodeSaving] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

  // Transfer Products state
  const [transferSource, setTransferSource] = useState<SellerWithDetails | null>(null)
  const [transferProductCount, setTransferProductCount] = useState(0)
  const [transferTargetId, setTransferTargetId] = useState("")
  const [transferTargetSearch, setTransferTargetSearch] = useState("")
  const [transferring, setTransferring] = useState(false)
  const [transferConfirmed, setTransferConfirmed] = useState(false)

  // Export Products state
  const [exportSeller, setExportSeller] = useState<SellerWithDetails | null>(null)
  const [exporting, setExporting] = useState(false)

  // Create Seller modal state
  const [showCreateSeller, setShowCreateSeller] = useState(false)
  const [createFullName, setCreateFullName] = useState("")
  const [createEmail, setCreateEmail] = useState("")
  const [createPassword, setCreatePassword] = useState("")
  const [createCompany, setCreateCompany] = useState("")
  const [createMainCategory, setCreateMainCategory] = useState<string | null>(null)
  const [createSubcategories, setCreateSubcategories] = useState<string[]>([])
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const filtered = sellers.filter((s) => {
    const term = search.toLowerCase()
    if (!term) return true
    return (
      s.display_name.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      (s.company?.toLowerCase().includes(term) ?? false)
    )
  })

  const toggleExpand = (sellerId: string) => {
    setExpandedSellers((prev) => {
      const next = new Set(prev)
      if (next.has(sellerId)) {
        next.delete(sellerId)
      } else {
        next.add(sellerId)
      }
      return next
    })
  }

  const openEdit = (seller: SellerWithDetails) => {
    setEditUser(seller)
    setEditName(seller.display_name)
    setEditEmail(seller.email)
    setEditRole(seller.role)
    setEditCompany(seller.company ?? "")
    setEditMainCategory(seller.main_category)
    setEditSubcategories([...(seller.subcategories ?? [])])
    setShowCategoryWarning(false)
  }

  const selectMainCategory = (categoryName: string) => {
    if (editMainCategory === categoryName) {
      // Deselect
      setEditMainCategory(null)
      setEditSubcategories([])
    } else {
      // Select new main category, clear subcategories
      setEditMainCategory(categoryName)
      setEditSubcategories([])
    }
    setShowCategoryWarning(false)
  }

  const toggleSubcategory = (subcategoryName: string) => {
    setEditSubcategories((prev) =>
      prev.includes(subcategoryName)
        ? prev.filter((s) => s !== subcategoryName)
        : [...prev, subcategoryName]
    )
    setShowCategoryWarning(false)
  }

  // Detect if saving would remove categories and require product deletion
  const getCategoryChanges = () => {
    if (!editUser) return { needsWarning: false, mainCategoryChanged: false, removedSubcategories: [] as string[] }
    const oldMain = editUser.main_category
    const oldSubs = editUser.subcategories ?? []
    const newMain = editMainCategory
    const newSubs = editSubcategories

    const mainCategoryChanged = !!oldMain && oldMain !== newMain
    const removedSubcategories = oldMain === newMain
      ? oldSubs.filter((s) => !newSubs.includes(s))
      : []

    return {
      needsWarning: mainCategoryChanged || removedSubcategories.length > 0,
      mainCategoryChanged,
      removedSubcategories,
    }
  }

  const handleEditSave = async () => {
    if (!editUser) return

    const { needsWarning, mainCategoryChanged, removedSubcategories } = getCategoryChanges()

    // Show confirmation if categories were removed and warning not yet acknowledged
    if (needsWarning && !showCategoryWarning) {
      setShowCategoryWarning(true)
      return
    }

    setEditSaving(true)
    setShowCategoryWarning(false)

    // Delete products from removed categories
    if (mainCategoryChanged || removedSubcategories.length > 0) {
      const deleteResult = await adminDeleteProductsByRemovedCategories(
        editUser.id,
        editUser.main_category,
        editMainCategory,
        removedSubcategories
      )
      if (deleteResult.error) {
        setEditSaving(false)
        return
      }
    }

    // Save user info and categories in parallel, and sync to Clerk
    const clerkUpdates: { display_name?: string; email?: string } = {}
    if (editName !== editUser.display_name) clerkUpdates.display_name = editName
    if (editEmail !== editUser.email) clerkUpdates.email = editEmail

    const [userResult, catResult] = await Promise.all([
      adminUpdateUser(editUser.id, {
        display_name: editName,
        email: editEmail,
        role: editRole,
        company: editCompany,
      }),
      editMainCategory
        ? adminUpdateSellerCategories(editUser.id, editMainCategory, editSubcategories)
        : adminClearSellerCategories(editUser.id),
    ])

    // Sync name/email changes to Clerk (best-effort, don't block save)
    if (Object.keys(clerkUpdates).length > 0) {
      const clerkResult = await adminUpdateSellerClerk(editUser.id, clerkUpdates)
      if (clerkResult.error) {
        console.error("Clerk sync error:", clerkResult.error)
      }
    }

    setEditSaving(false)
    if (!userResult.error && !catResult.error) {
      setEditUser(null)
      window.location.reload()
    }
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    setDeleting(true)
    const result = await adminDeleteUser(deleteUser.id)
    setDeleting(false)
    if (!result.error) {
      setDeleteUser(null)
      window.location.reload()
    }
  }

  const startEditCode = (seller: SellerWithDetails) => {
    setEditingCodeUserId(seller.id)
    setEditingCodeValue(seller.user_code ?? "S")
    setCodeError(null)
  }

  const cancelEditCode = () => {
    setEditingCodeUserId(null)
    setEditingCodeValue("")
    setCodeError(null)
  }

  const handleSaveCode = async (userId: string) => {
    if (!editingCodeValue.trim()) {
      setCodeError(tCommon("codeCannotBeEmpty"))
      return
    }
    setCodeSaving(true)
    setCodeError(null)
    const result = await adminUpdateUserCode(userId, editingCodeValue.trim())
    setCodeSaving(false)
    if (result.error) {
      setCodeError(result.error)
    } else {
      setEditingCodeUserId(null)
      setEditingCodeValue("")
      window.location.reload()
    }
  }

  // Build hierarchical display for a seller's categories
  const buildCategoryDisplay = (seller: SellerWithDetails) => {
    if (!seller.main_category) return null
    return {
      main: seller.main_category,
      subs: seller.subcategories ?? [],
    }
  }

  // ─── Transfer Products ──────────────────────────────────────────────────────

  const openTransfer = async (seller: SellerWithDetails) => {
    setTransferSource(seller)
    setTransferTargetId("")
    setTransferTargetSearch("")
    setTransferring(false)
    setTransferConfirmed(false)
    const count = await adminGetSellerProductCount(seller.id)
    setTransferProductCount(count)
  }

  const handleTransfer = async () => {
    if (!transferSource || !transferTargetId) return
    if (!transferConfirmed) {
      setTransferConfirmed(true)
      return
    }
    setTransferring(true)
    const result = await adminTransferProducts(transferSource.id, transferTargetId)
    setTransferring(false)
    if (result.error) {
      alert(result.error)
    } else {
      const targetSeller = sellers.find((s) => s.id === transferTargetId)
      alert(`${result.transferred} products transferred from ${transferSource.display_name} to ${targetSeller?.display_name}`)
      setTransferSource(null)
      window.location.reload()
    }
  }

  const filteredTargetSellers = sellers.filter((s) => {
    if (transferSource && s.id === transferSource.id) return false
    if (!transferTargetSearch) return true
    const term = transferTargetSearch.toLowerCase()
    return (
      s.display_name.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      (s.company?.toLowerCase().includes(term) ?? false)
    )
  })

  // ─── Export Products ────────────────────────────────────────────────────────

  const handleExportExcel = async (seller: SellerWithDetails) => {
    setExporting(true)
    try {
      const products = await adminGetSellerProducts(seller.id)
      const ExcelJS = await import("exceljs")
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet("Products")
      sheet.columns = [
        { header: "Name", key: "name", width: 30 },
        { header: "Model Number", key: "model_number", width: 20 },
        { header: "Category", key: "category", width: 20 },
        { header: "Price USD", key: "price_usd", width: 15 },
        { header: "Price CNY", key: "price_cny", width: 15 },
        { header: "Stock", key: "stock", width: 10 },
      ]
      for (const p of products) {
        sheet.addRow({
          name: p.name,
          model_number: p.model_number,
          category: p.category,
          price_usd: p.price_usd ?? "",
          price_cny: p.price_cny ?? "",
          stock: p.stock ?? 0,
        })
      }
      // Style header row
      sheet.getRow(1).font = { bold: true }
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${seller.display_name}-products.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Excel export failed:", err)
      alert("Failed to export Excel")
    }
    setExporting(false)
    setExportSeller(null)
  }

  const handleExportPDF = async (seller: SellerWithDetails) => {
    setExporting(true)
    try {
      const products = await adminGetSellerProducts(seller.id)
      const jsPDF = (await import("jspdf")).default
      const pdf = new jsPDF("l", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()

      // Title
      pdf.setFontSize(16)
      pdf.text(`Products - ${seller.display_name}`, 14, 20)
      pdf.setFontSize(10)
      pdf.text(`Total: ${products.length} products`, 14, 28)

      // Table header
      const startY = 36
      const colWidths = [70, 40, 40, 30, 30, 25]
      const headers = ["Name", "Model Number", "Category", "Price USD", "Price CNY", "Stock"]
      let y = startY

      pdf.setFillColor(240, 240, 240)
      pdf.rect(14, y - 5, pageWidth - 28, 8, "F")
      pdf.setFontSize(9)
      pdf.setFont("helvetica", "bold")
      let x = 14
      for (let i = 0; i < headers.length; i++) {
        pdf.text(headers[i], x, y)
        x += colWidths[i]
      }

      // Table rows
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(8)
      y += 8
      for (const p of products) {
        if (y > pdf.internal.pageSize.getHeight() - 15) {
          pdf.addPage()
          y = 20
        }
        x = 14
        const row = [
          (p.name ?? "").substring(0, 40),
          p.model_number ?? "",
          p.category ?? "",
          p.price_usd != null ? String(p.price_usd) : "",
          p.price_cny != null ? String(p.price_cny) : "",
          String(p.stock ?? 0),
        ]
        for (let i = 0; i < row.length; i++) {
          pdf.text(row[i], x, y)
          x += colWidths[i]
        }
        y += 6
      }

      pdf.save(`${seller.display_name}-products.pdf`)
    } catch (err) {
      console.error("PDF export failed:", err)
      alert("Failed to export PDF")
    }
    setExporting(false)
    setExportSeller(null)
  }

  // ─── Create Seller ──────────────────────────────────────────────────────────

  const openCreateSeller = () => {
    setCreateFullName("")
    setCreateEmail("")
    setCreatePassword("")
    setCreateCompany("")
    setCreateMainCategory(null)
    setCreateSubcategories([])
    setCreateError(null)
    setShowCreateSeller(true)
  }

  const selectCreateMainCategory = (categoryName: string) => {
    if (createMainCategory === categoryName) {
      setCreateMainCategory(null)
      setCreateSubcategories([])
    } else {
      setCreateMainCategory(categoryName)
      setCreateSubcategories([])
    }
  }

  const toggleCreateSubcategory = (subcategoryName: string) => {
    setCreateSubcategories((prev) =>
      prev.includes(subcategoryName)
        ? prev.filter((s) => s !== subcategoryName)
        : [...prev, subcategoryName]
    )
  }

  const handleCreateSeller = async () => {
    setCreateError(null)
    setCreateSaving(true)
    const result = await adminCreateSeller({
      fullName: createFullName,
      email: createEmail,
      password: createPassword,
      company: createCompany,
      mainCategory: createMainCategory,
      subcategories: createSubcategories,
    })
    setCreateSaving(false)
    if (result.error) {
      setCreateError(result.error)
    } else {
      setShowCreateSeller(false)
      window.location.reload()
    }
  }

  // Total number of columns in the table (must match TableHead count below)
  const columnCount = 11

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tCommon("searchSellers")} className="pl-9" />
        </div>
        <Button onClick={openCreateSeller} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Seller
        </Button>
      </div>

      {filtered.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-[50px]">Logo</TableHead>
                <TableHead>{tCommon("name")}</TableHead>
                <TableHead>{tCommon("email")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>User Code</TableHead>
                <TableHead>{tCommon("company")}</TableHead>
                <TableHead>{t("category")}</TableHead>
                <TableHead>{t("joined")}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((seller, index) => {
                const isExpanded = expandedSellers.has(seller.id)
                const catDisplay = buildCategoryDisplay(seller)
                return (
                  <>
                    <TableRow key={seller.id}>
                      <TableCell className="w-10 px-2">
                        {seller.buyers.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleExpand(seller.id)}
                            title={isExpanded ? "Collapse" : "Expand buyers"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <span className="inline-block h-7 w-7" />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center overflow-hidden">
                          {seller.logo_url ? (
                            <img src={seller.logo_url} alt={`Logo for ${seller.display_name}`} className="h-full w-full object-contain" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{seller.display_name}</TableCell>
                      <TableCell>{seller.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(seller.role)}>
                          {seller.role.charAt(0).toUpperCase() + seller.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingCodeUserId === seller.id ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Input
                                value={editingCodeValue}
                                onChange={(e) => setEditingCodeValue(e.target.value)}
                                className="h-7 w-24 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveCode(seller.id)
                                  if (e.key === "Escape") cancelEditCode()
                                }}
                                disabled={codeSaving}
                                autoFocus
                              />
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSaveCode(seller.id)} disabled={codeSaving}>
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEditCode} disabled={codeSaving}>
                                <X className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                            {codeError && (
                              <p className="text-xs text-destructive max-w-[200px]">{codeError}</p>
                            )}
                          </div>
                        ) : (
                          <button
                            className="text-sm hover:underline cursor-pointer text-left"
                            onClick={() => startEditCode(seller)}
                            title={tCommon("clickToEditCode")}
                          >
                            {seller.user_code || <span className="text-muted-foreground italic">Set code</span>}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{seller.company ?? "—"}</TableCell>
                      <TableCell>
                        {catDisplay ? (
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="font-medium">• {catDisplay.main}</span>
                              {catDisplay.subs.length > 0 && (
                                <div className="ml-3 text-muted-foreground">
                                  {catDisplay.subs.map((sub) => (
                                    <div key={sub}>- {sub}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(seller.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openTransfer(seller)} title="Transfer Products">
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExportSeller(seller)} title="Export Products">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(seller)} title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteUser(seller)} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && seller.buyers.length > 0 && (
                      <TableRow key={`${seller.id}-buyers`} className="bg-muted/50">
                        <TableCell colSpan={columnCount} className="py-3 px-8">
                          <div className="text-sm font-medium mb-2">{t("buyersListTitle")}</div>
                          <ul className="space-y-1">
                            {seller.buyers.map((buyer) => (
                              <li key={buyer.id} className="text-sm text-muted-foreground pl-2">
                                • {buyer.display_name}
                              </li>
                            ))}
                          </ul>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState icon={Store} title={t("noSellers")} description={tCommon("noSellersMatch")} />
      )}

      {/* Edit User Modal */}
      <Dialog open={!!editUser} onOpenChange={(v) => { if (!v) setEditUser(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                options={[
                  { value: "admin", label: tCommon("adminRole") },
                  { value: "seller", label: tCommon("sellerRole") },
                  { value: "buyer", label: tCommon("buyerRole") },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} />
            </div>

            {/* Categories section — single main category + multi-select subcategories */}
            <div className="space-y-2">
              <Label>Main Category</Label>
              <div className="flex flex-wrap gap-2">
                {mainCats.map((main) => {
                  const isSelected = editMainCategory === main.name
                  return (
                    <button
                      key={main.id}
                      type="button"
                      onClick={() => selectMainCategory(main.name)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                      }`}
                    >
                      {main.name}
                    </button>
                  )
                })}
              </div>

              {/* Show subcategories for the selected main category */}
              {editMainCategory && (() => {
                const mainCat = mainCats.find((m) => m.name === editMainCategory)
                if (!mainCat) return null
                const subs = subCatMap[mainCat.id] ?? []
                if (subs.length === 0) return null
                return (
                  <div className="mt-3 rounded-md border p-3 space-y-2 max-h-48 overflow-y-auto">
                    <div className="font-medium text-sm mb-2">Subcategories</div>
                    <div className="flex flex-wrap gap-1.5">
                      {subs.map((sub) => {
                        const subSelected = editSubcategories.includes(sub.name)
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => toggleSubcategory(sub.name)}
                            className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                              subSelected
                                ? "bg-primary/80 text-primary-foreground border-primary/80"
                                : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                            }`}
                          >
                            {sub.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Category removal warning */}
              {showCategoryWarning && (() => {
                const { mainCategoryChanged, removedSubcategories } = getCategoryChanges()
                return (
                  <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <p className="text-sm text-destructive">
                      {mainCategoryChanged
                        ? `Changing the main category will delete all products under "${editUser?.main_category}" for this seller. Are you sure?`
                        : `Removing ${removedSubcategories.length === 1 ? `subcategory "${removedSubcategories[0]}"` : `${removedSubcategories.length} subcategories`} will delete all products in ${removedSubcategories.length === 1 ? "it" : "them"} for this seller. Are you sure?`}
                    </p>
                  </div>
                )
              })()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditUser(null); setShowCategoryWarning(false) }}>{tCommon("cancel")}</Button>
            <Button onClick={handleEditSave} disabled={editSaving} variant={showCategoryWarning ? "destructive" : "default"}>
              {editSaving ? tCommon("saving") : showCategoryWarning ? "Confirm & Save" : tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <Dialog open={!!deleteUser} onOpenChange={(v) => { if (!v) setDeleteUser(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{tCommon("deleteUser")}</DialogTitle></DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete <strong>{deleteUser?.display_name}</strong>? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>{tCommon("cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? tCommon("deleting") : tCommon("deleteUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Products Dialog */}
      <Dialog open={!!transferSource} onOpenChange={(v) => { if (!v) { setTransferSource(null); setTransferConfirmed(false) } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transfer Products</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              <strong>{transferSource?.display_name}</strong> has <strong>{transferProductCount}</strong> product{transferProductCount !== 1 ? "s" : ""}.
            </p>
            <div className="space-y-2">
              <Label>Transfer to seller</Label>
              <Input
                placeholder="Search sellers..."
                value={transferTargetSearch}
                onChange={(e) => { setTransferTargetSearch(e.target.value); setTransferConfirmed(false) }}
              />
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {filteredTargetSellers.length > 0 ? (
                  filteredTargetSellers.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setTransferTargetId(s.id); setTransferConfirmed(false) }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                        transferTargetId === s.id ? "bg-primary/10 font-medium" : ""
                      }`}
                    >
                      {s.display_name}{s.company ? ` (${s.company})` : ""}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-muted-foreground">No sellers found</p>
                )}
              </div>
            </div>
            {transferConfirmed && transferTargetId && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">
                  Are you sure you want to transfer all {transferProductCount} products from <strong>{transferSource?.display_name}</strong> to <strong>{sellers.find((s) => s.id === transferTargetId)?.display_name}</strong>? Products will be removed from {transferSource?.display_name}.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTransferSource(null); setTransferConfirmed(false) }}>{tCommon("cancel")}</Button>
            <Button
              onClick={handleTransfer}
              disabled={!transferTargetId || transferProductCount === 0 || transferring}
              variant={transferConfirmed ? "destructive" : "default"}
            >
              {transferring ? "Transferring..." : transferConfirmed ? "Confirm Transfer" : "Transfer Products"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Products Dialog */}
      <Dialog open={!!exportSeller} onOpenChange={(v) => { if (!v) setExportSeller(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Export Products — {exportSeller?.display_name}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              variant="outline"
              className="justify-start gap-3 h-12"
              onClick={() => exportSeller && handleExportExcel(exportSeller)}
              disabled={exporting}
            >
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Export as Excel
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-3 h-12"
              onClick={() => exportSeller && handleExportPDF(exportSeller)}
              disabled={exporting}
            >
              <FileText className="h-5 w-5 text-red-600" />
              Export as PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Seller Dialog */}
      <Dialog open={showCreateSeller} onOpenChange={(v) => { if (!v) setShowCreateSeller(false) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Seller Account</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
            {createError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{createError}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={createFullName} onChange={(e) => setCreateFullName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="seller@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="Min. 8 characters" />
            </div>
            <div className="space-y-2">
              <Label>{tCommon("company")}</Label>
              <Input value={createCompany} onChange={(e) => setCreateCompany(e.target.value)} placeholder="Company name" />
            </div>

            {/* Category selection */}
            <div className="space-y-2">
              <Label>Specialization / Category</Label>
              <div className="flex flex-wrap gap-2">
                {mainCats.map((main) => {
                  const isSelected = createMainCategory === main.name
                  return (
                    <button
                      key={main.id}
                      type="button"
                      onClick={() => selectCreateMainCategory(main.name)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                      }`}
                    >
                      {main.name}
                    </button>
                  )
                })}
              </div>

              {/* Show subcategories for the selected main category */}
              {createMainCategory && (() => {
                const mainCat = mainCats.find((m) => m.name === createMainCategory)
                if (!mainCat) return null
                const subs = subCatMap[mainCat.id] ?? []
                if (subs.length === 0) return null
                return (
                  <div className="mt-3 rounded-md border p-3 space-y-2 max-h-48 overflow-y-auto">
                    <div className="font-medium text-sm mb-2">Subcategories</div>
                    <div className="flex flex-wrap gap-1.5">
                      {subs.map((sub) => {
                        const subSelected = createSubcategories.includes(sub.name)
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => toggleCreateSubcategory(sub.name)}
                            className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                              subSelected
                                ? "bg-primary/80 text-primary-foreground border-primary/80"
                                : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                            }`}
                          >
                            {sub.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSeller(false)}>{tCommon("cancel")}</Button>
            <Button onClick={handleCreateSeller} disabled={createSaving}>
              {createSaving ? tCommon("saving") : "Create Seller"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
