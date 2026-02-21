import { getAllUsers } from "@/lib/actions/admin"
import { AdminUsersList } from "./admin-users-list"

export default async function AdminUsersPage() {
  const users = await getAllUsers()

  const mapped = users.map((u) => ({
    id: u.id,
    display_name: u.display_name,
    email: u.email,
    role: u.role,
    company: u.company,
    created_at: u.created_at,
  }))

  return <AdminUsersList users={mapped} />
}
