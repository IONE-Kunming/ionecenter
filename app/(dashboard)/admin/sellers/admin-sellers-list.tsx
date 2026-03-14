"use client"

import { useState, useMemo } from "react"
import { Store, Search, Pencil, Trash2, Check, X, ChevronDown, ChevronRight } from "lucide-react"
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
import { adminUpdateUser, adminDeleteUser, adminUpdateUserCode, adminUpdateSellerCategories, adminDeleteProductsByCategory } from "@/lib/actions/admin"
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

  // Confirmation dialog state for category removal
  const [showCategoryWarning, setShowCategoryWarning] = useState(false)

  // Local sellers state for immediate UI updates
  const [localSellers, setLocalSellers] = useState(sellers)

  // Delete modal state
  const [deleteUser, setDeleteUser] = useState<SellerWithDetails | null>(null)
  const [deleting, setDeleting] = useState(false)

  // User code editing state
  const [editingCodeUserId, setEditingCodeUserId] = useState<string | null>(null)
  const [editingCodeValue, setEditingCodeValue] = useState("")
  const [codeSaving, setCodeSaving] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

  const filtered = localSellers.filter((s) => {
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
  }

  const selectMainCategory = (categoryName: string) => {
    if (editMainCategory === categoryName) {
      // Deselect: clear main and subcategories
      setEditMainCategory(null)
      setEditSubcategories([])
    } else {
      // Select new main category, clear subcategories
      setEditMainCategory(categoryName)
      setEditSubcategories([])
    }
  }

  const toggleSubcategory = (subName: string) => {
    setEditSubcategories((prev) =>
      prev.includes(subName)
        ? prev.filter((s) => s !== subName)
        : [...prev, subName]
    )
  }

  // Determine if saving will remove categories/subcategories that could affect products
  const willRemoveCategories = (seller: SellerWithDetails): { removedMainCategory: string | null; removedSubcategories: string[] } => {
    let removedMainCategory: string | null = null
    const removedSubcategories: string[] = []

    const oldMain = seller.main_category
    const oldSubs = seller.subcategories ?? []

    if (oldMain && oldMain !== editMainCategory) {
      // Main category changed — all products from old main category should be deleted
      removedMainCategory = oldMain
    } else if (oldMain && oldMain === editMainCategory) {
      // Same main category — check for removed subcategories
      for (const sub of oldSubs) {
        if (!editSubcategories.includes(sub)) {
          removedSubcategories.push(sub)
        }
      }
    }

    return { removedMainCategory, removedSubcategories }
  }

  const handleEditSave = async (confirmed = false) => {
    if (!editUser) return

    // Check if categories are being removed
    const { removedMainCategory, removedSubcategories } = willRemoveCategories(editUser)
    const hasRemovals = removedMainCategory !== null || removedSubcategories.length > 0

    if (hasRemovals && !confirmed) {
      // Show confirmation dialog
      setShowCategoryWarning(true)
      return
    }

    setEditSaving(true)

    // If categories were removed, delete the related products first
    if (hasRemovals) {
      const deleteResult = await adminDeleteProductsByCategory(
        editUser.id,
        removedMainCategory,
        removedSubcategories
      )
      if (deleteResult.error) {
        setEditSaving(false)
        return
      }
    }

    // Save user data
    const userResult = await adminUpdateUser(editUser.id, {
      display_name: editName,
      email: editEmail,
      role: editRole,
      company: editCompany,
    })

    if (userResult.error) {
      setEditSaving(false)
      return
    }

    // Save categories if main category is selected
    if (editMainCategory) {
      const catResult = await adminUpdateSellerCategories(editUser.id, editMainCategory, editSubcategories)
      if (catResult.error) {
        setEditSaving(false)
        return
      }
    }

    // Update local state immediately
    setLocalSellers((prev) =>
      prev.map((s) =>
        s.id === editUser.id
          ? {
              ...s,
              display_name: editName,
              email: editEmail,
              company: editCompany || null,
              main_category: editMainCategory,
              subcategories: editSubcategories,
            }
          : s
      )
    )

    setEditSaving(false)
    setShowCategoryWarning(false)
    setEditUser(null)
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

  // Build hierarchical display for a seller's category data
  const buildCategoryDisplay = (seller: SellerWithDetails) => {
    if (!seller.main_category) return null
    return {
      main: seller.main_category,
      subs: seller.subcategories ?? [],
    }
  }

  // Total number of columns in the table (must match TableHead count below)
  const columnCount = 10

  return (
    <div className="space-y-6">
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
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-12">#</TableHead>
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
                const selectedMain = mainCats.find((m) => m.name === editMainCategory)
                if (!selectedMain) return null
                const subs = subCatMap[selectedMain.id] ?? []
                if (subs.length === 0) return null
                return (
                  <div className="mt-3 rounded-md border p-3 space-y-2 max-h-48 overflow-y-auto">
                    <div className="font-medium text-sm mb-2">Subcategories for {editMainCategory}:</div>
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>{tCommon("cancel")}</Button>
            <Button onClick={() => handleEditSave()} disabled={editSaving}>
              {editSaving ? tCommon("saving") : tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category removal confirmation dialog */}
      <Dialog open={showCategoryWarning} onOpenChange={(v) => { if (!v) setShowCategoryWarning(false) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Warning: Products will be deleted</DialogTitle></DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Removing this category will delete all products in it for this seller. Are you sure?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryWarning(false)}>{tCommon("cancel")}</Button>
            <Button variant="destructive" onClick={() => { setShowCategoryWarning(false); handleEditSave(true) }}>
              Confirm & Save
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
    </div>
  )
}
