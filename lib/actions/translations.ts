"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { TranslationCacheEntry } from "@/types/database"

const TRANSLATION_BATCH_SIZE = 10

// ---------------------------------------------------------------------------
// Helpers – flatten / unflatten nested message objects
// ---------------------------------------------------------------------------

type FlatMessages = Record<string, string>

/**
 * Flatten a nested messages object into dot-notation keys.
 * e.g. { nav: { home: "Home" } } → { "nav.home": "Home" }
 */
export function flattenMessages(
  obj: Record<string, unknown>,
  prefix = ""
): FlatMessages {
  const result: FlatMessages = {}
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenMessages(value as Record<string, unknown>, path))
    } else {
      result[path] = String(value)
    }
  }
  return result
}

/**
 * Reconstruct a nested object from dot-notation keys.
 * e.g. { "nav.home": "Home" } → { nav: { home: "Home" } }
 */
export function unflattenMessages(flat: FlatMessages): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".")
    let current: Record<string, unknown> = result
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current) || typeof current[parts[i]] !== "object") {
        current[parts[i]] = {}
      }
      current = current[parts[i]] as Record<string, unknown>
    }
    current[parts[parts.length - 1]] = value
  }
  return result
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch all cached translations for a locale and return as a nested messages
 * object suitable for next-intl.
 */
export async function getCachedMessages(
  locale: string
): Promise<Record<string, unknown> | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("translation_cache")
    .select("message_key, translated_text")
    .eq("locale", locale)

  if (error || !data || data.length === 0) return null

  const flat: FlatMessages = {}
  for (const row of data as Pick<TranslationCacheEntry, "message_key" | "translated_text">[]) {
    flat[row.message_key] = row.translated_text
  }
  return unflattenMessages(flat)
}

/**
 * Identify keys in the English source messages that are missing or changed in
 * the cache for `targetLocale`. Returns the flat map of keys that need
 * translation.
 */
export async function getMissingTranslations(
  targetLocale: string
): Promise<{ key: string; text: string }[]> {
  // Load English source messages
  const enMessages = (await import("@/messages/en.json")).default
  const flatEn = flattenMessages(enMessages as Record<string, unknown>)

  // Load existing cache
  const supabase = createAdminClient()
  const { data: cached } = await supabase
    .from("translation_cache")
    .select("message_key, source_text")
    .eq("locale", targetLocale)

  const cacheMap = new Map<string, string>()
  if (cached) {
    for (const row of cached) {
      cacheMap.set(row.message_key, row.source_text)
    }
  }

  // Determine what's missing or changed
  const missing: { key: string; text: string }[] = []
  for (const [key, text] of Object.entries(flatEn)) {
    if (!cacheMap.has(key) || cacheMap.get(key) !== text) {
      missing.push({ key, text })
    }
  }

  return missing
}

/**
 * Translate a single text using the /api/translate endpoint (server-side
 * internal call). Falls back to the original text on failure.
 */
async function translateViaApi(
  text: string,
  targetLocale: string,
  targetLanguageName: string
): Promise<string> {
  const ollamaUrl = process.env.OLLAMA_URL
  if (!ollamaUrl) return text

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const user = process.env.OLLAMA_USER || ""
  const pass = process.env.OLLAMA_PASSWORD || ""
  if (user && pass) {
    headers["Authorization"] = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64")
  }

  const prompt = `Translate from English to ${targetLanguageName}. Return ONLY the translation:\n\n${text}`

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "gemma3:1b",
        prompt,
        stream: false,
        options: { temperature: 0.3 },
      }),
    })

    if (!response.ok) return text

    const data = await response.json()
    return data.response?.trim() || text
  } catch (error) {
    console.error("Translation API error:", error)
    return text
  }
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  zh: "Chinese",
  ar: "Arabic",
  ur: "Urdu",
}

/**
 * Translate all missing/changed keys for `targetLocale`, store in Supabase,
 * and return the count of newly translated entries.
 */
export async function translateAndCacheContent(
  targetLocale: string
): Promise<{ translated: number; error?: string }> {
  if (targetLocale === "en") {
    return { translated: 0, error: "Cannot translate to English (source language)" }
  }

  const langName = LANGUAGE_NAMES[targetLocale] ?? targetLocale
  const missing = await getMissingTranslations(targetLocale)
  if (missing.length === 0) return { translated: 0 }

  const supabase = createAdminClient()
  let translated = 0

  const batchSize = TRANSLATION_BATCH_SIZE
  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(async ({ key, text }) => {
        const translatedText = await translateViaApi(text, targetLocale, langName)
        return {
          locale: targetLocale,
          message_key: key,
          source_text: text,
          translated_text: translatedText,
        }
      })
    )

    const { error } = await supabase
      .from("translation_cache")
      .upsert(results, { onConflict: "locale,message_key" })

    if (error) {
      console.error("Translation cache upsert error:", error)
      return { translated, error: error.message }
    }

    translated += results.length
  }

  return { translated }
}
