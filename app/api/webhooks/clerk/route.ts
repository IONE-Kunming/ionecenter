import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
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

      await supabase
        .from("users")
        .upsert(
          {
            clerk_id: id,
            email,
            display_name: displayName,
            role,
          },
          { onConflict: "clerk_id" }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
