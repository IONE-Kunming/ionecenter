import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, target_language } = body

    if (!text || !target_language) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase.functions.invoke(
      "translate-message",
      {
        body: {
          text,
          targetLanguages: [target_language],
          sourceLanguage: "auto",
        },
      }
    )

    if (error) {
      console.error("Translation edge function error:", error)
      return NextResponse.json(
        { error: "Translation failed" },
        { status: 502 }
      )
    }

    // Edge function returns { translations: { [lang]: text }, original, sourceLanguage }
    const translatedText = data?.translations?.[target_language] ?? text

    return NextResponse.json({ translated_text: translatedText })
  } catch (error) {
    console.error("Translation API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
