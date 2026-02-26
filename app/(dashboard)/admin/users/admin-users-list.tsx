"use client"

import { useState } from "react"
import { Users, Search, Pencil, Trash2, UserX, Check, X } from "lucide-react"
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
import { adminUpdateUser, adminDeleteUser, adminDeactivateUser, adminUpdateUserCode } from "@/lib/actions/admin"
import type { UserRole } from "@/types/database"

interface UserRow {
  id: string
  display_name: string
  email: string
  role: UserRole
  company: string | null
  user_code: string | null
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

  // Deactivate modal state
  const [deactivateUser, setDeactivateUser] = useState<UserRow | null>(null)
  const [deactivating, setDeactivating] = useState(false)

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

  const handleDeactivate = async () => {
    if (!deactivateUser) return
    setDeactivating(true)
    const result = await adminDeactivateUser(deactivateUser.id)
    setDeactivating(false)
    if (!result.error) {
      setDeactivateUser(null)
      window.location.reload()
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
    if (!editingCodeValue.trim()) return
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
                <TableHead>User Code</TableHead>
                <TableHead>{tCommon("company")}</TableHead>
                <TableHead>{t("joined")}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium">{user.display_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-600 hover:text-yellow-700" onClick={() => setDeactivateUser(user)} title="Deactivate">
                        <UserX className="h-3.5 w-3.5" />
                      </Button>
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

      {/* Deactivate User Confirmation */}
      <Dialog open={!!deactivateUser} onOpenChange={(v) => { if (!v) setDeactivateUser(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Deactivate User</DialogTitle></DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to deactivate <strong>{deactivateUser?.display_name}</strong>? They will no longer be able to access the platform.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateUser(null)}>Cancel</Button>
            <Button className="bg-yellow-600 text-white hover:bg-yellow-700" onClick={handleDeactivate} disabled={deactivating}>
              {deactivating ? "Deactivating..." : "Deactivate User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
