import { NextRequest, NextResponse } from "next/server"

const OLLAMA_URL = process.env.OLLAMA_URL || "http://167.71.201.76:11434"
const OLLAMA_USER = process.env.OLLAMA_USER || ""
const OLLAMA_PASSWORD = process.env.OLLAMA_PASSWORD || ""
const MODEL = "gemma3:1b"

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

    const langLabel = target_language_name || target_language
    const prompt = `Translate from auto to ${langLabel}. Return ONLY the translation:\n\n${text}`

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (OLLAMA_USER && OLLAMA_PASSWORD) {
      headers["Authorization"] =
        "Basic " + Buffer.from(`${OLLAMA_USER}:${OLLAMA_PASSWORD}`).toString("base64")
    }

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.3 },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Ollama error: ${response.status} - ${errorText}`)
      return NextResponse.json(
        { error: "Translation failed" },
        { status: 502 }
      )
    }

    const data = await response.json()
    const translated = data.response?.trim() || ""

    return NextResponse.json({ translated_text: translated || text })
  } catch (error) {
    console.error("Translation API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
