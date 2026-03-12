const FALLBACK_RATE = 7.25
const API_URL = "https://api.exchangerate-api.com/v4/latest/USD"
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

let serverCache: { rate: number; timestamp: number } | null = null

export async function getExchangeRate(): Promise<number> {
  if (serverCache && Date.now() - serverCache.timestamp < CACHE_TTL_MS) {
    return serverCache.rate
  }
  try {
    const res = await fetch(API_URL)
    if (!res.ok) throw new Error("API error")
    const data = await res.json()
    if (data?.rates?.CNY) {
      serverCache = { rate: data.rates.CNY, timestamp: Date.now() }
      return data.rates.CNY
    }
  } catch {
    // Use fallback rate
  }
  return FALLBACK_RATE
}
