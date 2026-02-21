import { auth, clerkClient } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    // Check if any admin already exists
    const { data: existingAdmins } = await adminSupabase
      .from("users")
      .select("id")
      .eq("role", "admin")
      .limit(1)

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json(
        { error: "An admin account already exists. Contact an existing admin to grant admin access." },
        { status: 403 }
      )
    }

    // Promote current user to admin in Clerk
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { role: "admin" },
    })

    // Update role in Supabase
    const { error } = await adminSupabase
      .from("users")
      .update({ role: "admin" })
      .eq("clerk_id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Admin account created successfully" })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
