const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  zh: "Chinese",
  ar: "Arabic",
  ur: "Urdu",
}

export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  if (!text.trim()) return text

  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      target_language: targetLanguage,
      target_language_name: LANGUAGE_NAMES[targetLanguage] ?? targetLanguage,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error("Translation error:", err)
    throw new Error("Translation failed")
  }

  const data = await res.json()
  return data?.translated_text ?? text
}
