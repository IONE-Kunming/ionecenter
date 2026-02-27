import { createClient } from "@/lib/supabase/client"

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
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke("translate", {
    body: options,
  })

  if (error) {
    return { translated: "", source: options.text, targetLanguage: options.targetLanguage, error: error.message }
  }

  return data as TranslateResult
}
