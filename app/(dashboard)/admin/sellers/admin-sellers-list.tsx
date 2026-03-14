"use client"

import { useState } from "react"
import { Store, Search, Pencil, Trash2, Check, X, ChevronDown, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
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
import { adminUpdateUser, adminDeleteUser, adminUpdateUserCode, adminUpdateSellerCategories } from "@/lib/actions/admin"
import type { SellerWithDetails } from "@/lib/actions/admin"
import type { UserRole } from "@/types/database"
import type { CategoryData } from "@/lib/categories"

function roleBadgeVariant(role: UserRole) {
  if (role === "admin") return "destructive" as const
  if (role === "seller") return "warning" as const
  return "default" as const
}

export function AdminSellersList({ sellers, categoryData }: { sellers: SellerWithDetails[]; categoryData: CategoryData }) {
  const t = useTranslations("adminSellers")
  const tCommon = useTranslations("common")
  const { formatDate } = useFormatters()
  const [search, setSearch] = useState("")
  const [expandedSellers, setExpandedSellers] = useState<Set<string>>(new Set())

  // Edit modal state
  const [editUser, setEditUser] = useState<SellerWithDetails | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState("")
  const [editCompany, setEditCompany] = useState("")
  const [editMainCategory, setEditMainCategory] = useState<string | null>(null)
  const [editSubcategories, setEditSubcategories] = useState<string[]>([])
  const [editSaving, setEditSaving] = useState(false)

  // Delete modal state
  const [deleteUser, setDeleteUser] = useState<SellerWithDetails | null>(null)
  const [deleting, setDeleting] = useState(false)

  // User code editing state
  const [editingCodeUserId, setEditingCodeUserId] = useState<string | null>(null)
  const [editingCodeValue, setEditingCodeValue] = useState("")
  const [codeSaving, setCodeSaving] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

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
    setEditMainCategory(seller.main_category ?? null)
    setEditSubcategories(seller.subcategories ?? [])
  }

  const handleEditSave = async () => {
    if (!editUser) return
    setEditSaving(true)
    const results = await Promise.all([
      adminUpdateUser(editUser.id, {
        display_name: editName,
        email: editEmail,
        role: editRole,
        company: editCompany,
      }),
      editMainCategory
        ? adminUpdateSellerCategories(editUser.id, editMainCategory, editSubcategories)
        : Promise.resolve({ success: true }),
    ])
    setEditSaving(false)
    if (!results[0].error && !("error" in results[1] && results[1].error)) {
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
                        {seller.main_category ? (
                          <div className="text-sm">
                            <div className="font-medium">• {seller.main_category}</div>
                            {seller.subcategories.map((sub) => (
                              <div key={sub} className="ml-3 text-muted-foreground text-xs">- {sub}</div>
                            ))}
                          </div>
                        ) : seller.categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {seller.categories.map((cat) => (
                              <Badge key={cat} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
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

            {/* Categories Section */}
            <div className="space-y-3 border-t pt-4">
              <Label>Categories</Label>

              {/* Step 1: Select main category */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Select one main category:</p>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                  {categoryData.mainCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        if (editMainCategory === cat) return
                        setEditMainCategory(cat)
                        setEditSubcategories([])
                      }}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-md border transition-colors",
                        editMainCategory === cat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-input"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Select subcategories */}
              {editMainCategory && (categoryData.categoryMap[editMainCategory]?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Select subcategories:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                    {categoryData.categoryMap[editMainCategory].map((sub) => {
                      const isSelected = editSubcategories.includes(sub)
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            setEditSubcategories((prev) =>
                              isSelected
                                ? prev.filter((s) => s !== sub)
                                : [...prev, sub]
                            )
                          }}
                          className={cn(
                            "px-3 py-1.5 text-sm rounded-md border transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-muted border-input"
                          )}
                        >
                          {sub}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Display selected */}
              {editMainCategory && (
                <div className="text-sm bg-muted/50 rounded-md p-3">
                  <div className="font-medium">• {editMainCategory}</div>
                  {editSubcategories.map((sub) => (
                    <div key={sub} className="ml-4 text-muted-foreground">- {sub}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>{tCommon("cancel")}</Button>
            <Button onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? tCommon("saving") : tCommon("save")}
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
