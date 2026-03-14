"use client"

import { useState } from "react"
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
import { adminUpdateUser, adminDeleteUser, adminUpdateUserCode } from "@/lib/actions/admin"
import type { SellerWithDetails } from "@/lib/actions/admin"
import type { UserRole } from "@/types/database"

function roleBadgeVariant(role: UserRole) {
  if (role === "admin") return "destructive" as const
  if (role === "seller") return "warning" as const
  return "default" as const
}

export function AdminSellersList({ sellers }: { sellers: SellerWithDetails[] }) {
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
  }

  const handleEditSave = async () => {
    if (!editUser) return
    setEditSaving(true)
    const result = await adminUpdateUser(editUser.id, {
      display_name: editName,
      email: editEmail,
      role: editRole,
      company: editCompany,
    })
    setEditSaving(false)
    if (!result.error) {
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

  // Column count for the buyers sub-row
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
                        {seller.categories.length > 0 ? (
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
          <div className="space-y-4 mt-4">
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
