import { createClient } from "@/lib/supabase/client"

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

  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke("translate-message", {
    body: {
      text,
      target_language: targetLanguage,
      target_language_name: LANGUAGE_NAMES[targetLanguage] ?? targetLanguage,
    },
  })

  if (error) {
    console.error("Translation error:", error)
    throw new Error("Translation failed")
  }

  return data?.translated_text ?? text
}
