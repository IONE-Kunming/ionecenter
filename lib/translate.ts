interface TranslateOptions {
  text: string
  targetLanguage: string    // "en" | "ar" | "zh" | "ur"
  sourceLanguage?: string   // optional, auto-detected if omitted
}

interface TranslateResult {
  translated: string
  source: string
  targetLanguage: string
  error?: string
}

export async function translate(options: TranslateOptions): Promise<TranslateResult> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  })

  if (!res.ok) {
    const err = await res.json()
    return { translated: "", source: options.text, targetLanguage: options.targetLanguage, error: err.error }
  }

  return res.json()
}
