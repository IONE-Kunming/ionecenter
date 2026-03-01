import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"
import { getCachedMessages } from "@/lib/actions/translations"

export const locales = ["en", "zh", "ar", "ur"] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = "en"

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = (cookieStore.get("locale")?.value as Locale) || defaultLocale

  // English is always served from the static JSON file
  const staticMessages = (await import(`@/messages/${locale}.json`)).default

  if (locale === "en") {
    return { locale, messages: staticMessages }
  }

  // For non-English locales, try to load AI-translated content from cache
  try {
    const cachedMessages = await getCachedMessages(locale)
    if (cachedMessages) {
      // Merge: cached translations take priority, static JSON as fallback
      return {
        locale,
        messages: deepMerge(staticMessages, cachedMessages),
      }
    }
  } catch (error) {
    console.error("Failed to load cached translations:", error)
  }

  return { locale, messages: staticMessages }
})

/** Deep-merge `source` into `base`, overwriting leaf values. */
function deepMerge(
  base: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...base }
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === "object" &&
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof result[key] === "object" &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      )
    } else {
      result[key] = source[key]
    }
  }
  return result
}
