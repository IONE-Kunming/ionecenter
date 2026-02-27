import { NextRequest, NextResponse } from "next/server"

const OLLAMA_URL = process.env.OLLAMA_API_URL || "http://localhost:11434/api/generate"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:1b"
const OLLAMA_USER = process.env.OLLAMA_USER || ""
const OLLAMA_PASSWORD = process.env.OLLAMA_PASSWORD || ""

const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: "English",
  ar: "Arabic",
  zh: "Chinese (Simplified)",
  ur: "Urdu",
}

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage, sourceLanguage } = await request.json()

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "Missing required fields: text, targetLanguage" },
        { status: 400 }
      )
    }

    if (!SUPPORTED_LANGUAGES[targetLanguage]) {
      return NextResponse.json(
        { error: `Unsupported language: ${targetLanguage}. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(", ")}` },
        { status: 400 }
      )
    }

    const targetLangName = SUPPORTED_LANGUAGES[targetLanguage]
    const sourceLangName = sourceLanguage ? SUPPORTED_LANGUAGES[sourceLanguage] || sourceLanguage : undefined
    const langContext = sourceLangName
      ? `from ${sourceLangName} to ${targetLangName}`
      : `to ${targetLangName}`

    const prompt = `Translate the following text ${langContext}. Only return the translated text, nothing else.\n\nText: ${text}`

    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (OLLAMA_USER && OLLAMA_PASSWORD) {
      headers["Authorization"] = `Basic ${Buffer.from(`${OLLAMA_USER}:${OLLAMA_PASSWORD}`).toString("base64")}`
    }

    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
    })

    if (!res.ok) {
      throw new Error(`Ollama request failed: ${res.status}`)
    }

    const data = await res.json()
    const translated = data.response?.trim() || ""

    return NextResponse.json({ translated, source: text, targetLanguage })
  } catch (error) {
    console.error("Translation error:", error)
    return NextResponse.json(
      { error: "Translation failed. Please try again." },
      { status: 500 }
    )
  }
}
