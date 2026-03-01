"use client"

import { useState } from "react"
import { Users, Search, Pencil, Trash2, UserX, UserCheck, Check, X } from "lucide-react"
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
import { formatDate } from "@/lib/utils"
import { adminUpdateUser, adminDeleteUser, adminDeactivateUser, adminActivateUser, adminUpdateUserCode } from "@/lib/actions/admin"
import type { UserRole } from "@/types/database"
import "./status-toggle.css"

interface UserRow {
  id: string
  display_name: string
  email: string
  role: UserRole
  company: string | null
  user_code: string | null
  is_active: boolean
  created_at: string
}

function roleBadgeVariant(role: UserRole) {
  if (role === "admin") return "destructive" as const
  if (role === "seller") return "warning" as const
  return "default" as const
}

export function AdminUsersList({ users }: { users: UserRow[] }) {
  const t = useTranslations("adminUsers")
  const tCommon = useTranslations("common")
  const [search, setSearch] = useState("")

  // Edit modal state
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState("")
  const [editCompany, setEditCompany] = useState("")
  const [editSaving, setEditSaving] = useState(false)

  // Delete modal state
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Deactivate/Activate modal state
  const [toggleUser, setToggleUser] = useState<UserRow | null>(null)
  const [toggling, setToggling] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)

  // Inline status toggle state
  const [statusOverrides, setStatusOverrides] = useState<Record<string, boolean>>({})
  const [togglingUsers, setTogglingUsers] = useState<Record<string, boolean>>({})
  const [toggleErrors, setToggleErrors] = useState<Record<string, string>>({})

  // User code editing state
  const [editingCodeUserId, setEditingCodeUserId] = useState<string | null>(null)
  const [editingCodeValue, setEditingCodeValue] = useState("")
  const [codeSaving, setCodeSaving] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.display_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  const openEdit = (user: UserRow) => {
    setEditUser(user)
    setEditName(user.display_name)
    setEditEmail(user.email)
    setEditRole(user.role)
    setEditCompany(user.company ?? "")
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

  const handleToggleActive = async () => {
    if (!toggleUser) return
    setToggling(true)
    setToggleError(null)
    const result = toggleUser.is_active
      ? await adminDeactivateUser(toggleUser.id)
      : await adminActivateUser(toggleUser.id)
    setToggling(false)
    if (result.error) {
      setToggleError(result.error)
    } else {
      setToggleUser(null)
      window.location.reload()
    }
  }

  const handleInlineToggle = async (user: UserRow) => {
    const currentActive = statusOverrides[user.id] ?? user.is_active
    const newActive = !currentActive

    // Optimistically update UI
    setStatusOverrides((prev) => ({ ...prev, [user.id]: newActive }))
    setTogglingUsers((prev) => ({ ...prev, [user.id]: true }))
    setToggleErrors((prev) => {
      const next = { ...prev }
      delete next[user.id]
      return next
    })

    const result = currentActive
      ? await adminDeactivateUser(user.id)
      : await adminActivateUser(user.id)

    setTogglingUsers((prev) => ({ ...prev, [user.id]: false }))

    if (result.error) {
      // Revert on failure
      setStatusOverrides((prev) => ({ ...prev, [user.id]: currentActive }))
      setToggleErrors((prev) => ({ ...prev, [user.id]: result.error! }))
    }
  }

  const startEditCode = (user: UserRow) => {
    setEditingCodeUserId(user.id)
    setEditingCodeValue(user.user_code ?? (user.role === "buyer" ? "B" : user.role === "seller" ? "S" : ""))
    setCodeError(null)
  }

  const cancelEditCode = () => {
    setEditingCodeUserId(null)
    setEditingCodeValue("")
    setCodeError(null)
  }

  const handleSaveCode = async (userId: string) => {
    if (!editingCodeValue.trim()) {
      setCodeError("Code cannot be empty.")
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tCommon("searchUsers")} className="pl-9" />
        </div>
      </div>

      {filtered.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{tCommon("name")}</TableHead>
                <TableHead>{tCommon("email")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>User Code</TableHead>
                <TableHead>{tCommon("company")}</TableHead>
                <TableHead>{t("joined")}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user, index) => (
                <TableRow key={user.id} className={!(statusOverrides[user.id] ?? user.is_active) ? "opacity-60" : undefined}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium">{user.display_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const active = statusOverrides[user.id] ?? user.is_active
                        return (
                          <label className="status-toggle-container" title={active ? "Active – click to deactivate" : "Inactive – click to activate"}>
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => handleInlineToggle(user)}
                              disabled={togglingUsers[user.id]}
                            />
                            <div className="status-toggle-checkmark" />
                          </label>
                        )
                      })()}
                      {!(statusOverrides[user.id] ?? user.is_active) && (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      {toggleErrors[user.id] && (
                        <span className="text-xs text-destructive max-w-[120px]" role="alert">{toggleErrors[user.id]}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingCodeUserId === user.id ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Input
                            value={editingCodeValue}
                            onChange={(e) => setEditingCodeValue(e.target.value)}
                            className="h-7 w-24 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveCode(user.id)
                              if (e.key === "Escape") cancelEditCode()
                            }}
                            disabled={codeSaving}
                            autoFocus
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSaveCode(user.id)} disabled={codeSaving}>
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
                        onClick={() => startEditCode(user)}
                        title="Click to edit user code"
                      >
                        {user.user_code || <span className="text-muted-foreground italic">Set code</span>}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.company ?? "—"}</TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {user.is_active ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-yellow-600 hover:text-yellow-700"
                          onClick={() => { setToggleUser(user); setToggleError(null) }}
                          title="Deactivate"
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700"
                          onClick={() => { setToggleUser(user); setToggleError(null) }}
                          title="Activate"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteUser(user)} title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState icon={Users} title={t("noUsers")} description="No users match your search." />
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
                  { value: "admin", label: "Admin" },
                  { value: "seller", label: "Seller" },
                  { value: "buyer", label: "Buyer" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <Dialog open={!!deleteUser} onOpenChange={(v) => { if (!v) setDeleteUser(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete User</DialogTitle></DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete <strong>{deleteUser?.display_name}</strong>? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate / Activate User Confirmation */}
      <Dialog open={!!toggleUser} onOpenChange={(v) => { if (!v) { setToggleUser(null); setToggleError(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{toggleUser?.is_active ? "Deactivate User" : "Activate User"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            {toggleUser?.is_active ? (
              <p className="text-sm text-muted-foreground">
                Are you sure you want to deactivate <strong>{toggleUser?.display_name}</strong>?
                Their account and all their products will be hidden from the website.
                They will not be able to log in or sign up with the same email.
                All data is preserved and can be restored by activating the account again.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Are you sure you want to activate <strong>{toggleUser?.display_name}</strong>?
                Their account and all their products will become visible again,
                and they will be able to log in as normal.
              </p>
            )}
            {toggleError && (
              <p className="text-sm text-destructive">{toggleError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setToggleUser(null); setToggleError(null) }}>Cancel</Button>
            {toggleUser?.is_active ? (
              <Button className="bg-yellow-600 text-white hover:bg-yellow-700" onClick={handleToggleActive} disabled={toggling}>
                {toggling ? "Deactivating..." : "Deactivate User"}
              </Button>
            ) : (
              <Button className="bg-green-600 text-white hover:bg-green-700" onClick={handleToggleActive} disabled={toggling}>
                {toggling ? "Activating..." : "Activate User"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
