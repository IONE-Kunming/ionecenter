import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateUniqueBuyerCode } from "@/lib/actions/users"
import crypto from "crypto"

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    email_addresses?: { email_address: string }[]
    first_name?: string | null
    last_name?: string | null
    public_metadata?: Record<string, unknown>
  }
}

function verifyWebhookSignature(
  payload: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): boolean {
  // Clerk/Svix signs: `${svixId}.${svixTimestamp}.${body}`
  const signedContent = `${svixId}.${svixTimestamp}.${payload}`
  // Secret is base64-encoded after the "whsec_" prefix
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64")
  const signature = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64")

  const expectedSignatures = svixSignature.split(" ").map((s) => s.replace(/^v1,/, ""))
  return expectedSignatures.some((expected) => signature === expected)
}

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  const svixId = req.headers.get("svix-id")
  const svixTimestamp = req.headers.get("svix-timestamp")
  const svixSignature = req.headers.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing webhook headers" }, { status: 400 })
  }

  // Verify timestamp freshness (within 5 minutes)
  const timestampSeconds = Number(svixTimestamp)
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (isNaN(timestampSeconds) || Math.abs(nowSeconds - timestampSeconds) > 300) {
    return NextResponse.json({ error: "Webhook timestamp too old" }, { status: 401 })
  }

  const body = await req.text()

  if (!verifyWebhookSignature(body, svixId, svixTimestamp, svixSignature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: ClerkWebhookEvent
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const { id, email_addresses, first_name, last_name, public_metadata } = event.data

      const email = email_addresses?.[0]?.email_address ?? ""
      const displayName =
        [first_name, last_name].filter(Boolean).join(" ") || email
      const role = (public_metadata?.role as string) || "buyer"
      const VALID_ROLES = ["admin", "seller", "buyer"]
      const safeRole = VALID_ROLES.includes(role) ? role : "buyer"

      const upsertData: Record<string, unknown> = {
        clerk_id: id,
        email,
        display_name: displayName,
        role: safeRole,
      }

      // Auto-generate buyer code for new buyers
      if (event.type === "user.created" && safeRole === "buyer") {
        upsertData.user_code = await generateUniqueBuyerCode(supabase)
      }

      await supabase
        .from("users")
        .upsert(upsertData, { onConflict: "clerk_id" })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
