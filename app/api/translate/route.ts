import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, target_language, target_language_name } = body

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
        body: { text, target_language, target_language_name },
      }
    )

    if (error) {
      console.error("Translation edge function error:", error)
      return NextResponse.json(
        { error: "Translation failed" },
        { status: 502 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Translation API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
