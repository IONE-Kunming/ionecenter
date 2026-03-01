import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { translateAndCacheContent, getMissingTranslations } from "@/lib/actions/translations"

const SUPPORTED_LOCALES = ["zh", "ar", "ur"]

/**
 * POST /api/admin/translate-content
 * Body: { locale: string } or { locale: "all" }
 *
 * Triggers AI translation of any new/changed English content and caches
 * the results in the translation_cache table.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify the caller is an admin
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("clerk_id", userId)
      .single()

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const requestedLocale = body.locale as string

    if (!requestedLocale) {
      return NextResponse.json({ error: "Missing 'locale' field" }, { status: 400 })
    }

    const locales =
      requestedLocale === "all"
        ? SUPPORTED_LOCALES
        : SUPPORTED_LOCALES.includes(requestedLocale)
          ? [requestedLocale]
          : null

    if (!locales) {
      return NextResponse.json(
        { error: `Unsupported locale: ${requestedLocale}. Supported: ${SUPPORTED_LOCALES.join(", ")}, all` },
        { status: 400 }
      )
    }

    const results: Record<string, { translated: number; error?: string }> = {}

    for (const locale of locales) {
      results[locale] = await translateAndCacheContent(locale)
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Translate content API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * GET /api/admin/translate-content?locale=zh
 *
 * Returns the count of missing/changed translations for a locale.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("clerk_id", userId)
      .single()

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const locale = req.nextUrl.searchParams.get("locale")
    if (!locale || !SUPPORTED_LOCALES.includes(locale)) {
      return NextResponse.json(
        { error: `Provide a supported locale: ${SUPPORTED_LOCALES.join(", ")}` },
        { status: 400 }
      )
    }

    const missing = await getMissingTranslations(locale)

    return NextResponse.json({
      locale,
      missingCount: missing.length,
      missingKeys: missing.slice(0, 20).map((m) => m.key),
    })
  } catch (error) {
    console.error("Translate content GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
