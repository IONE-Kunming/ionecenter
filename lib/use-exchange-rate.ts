"use client"

import { useState, useEffect } from "react"

const FALLBACK_RATE = 7.25
const API_URL = "https://api.exchangerate-api.com/v4/latest/USD"
const CACHE_KEY = "exchange_rate_usd_cny"
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

interface CachedRate {
  rate: number
  timestamp: number
}

function getCachedRate(): CachedRate | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed: CachedRate = JSON.parse(raw)
    if (Date.now() - parsed.timestamp < CACHE_TTL_MS) return parsed
  } catch {
    // Ignore parse errors
  }
  return null
}

function setCachedRate(rate: number): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }))
  } catch {
    // Ignore storage errors
  }
}

interface ExchangeRateResult {
  rate: number
  loading: boolean
}

export function useExchangeRate(): ExchangeRateResult {
  const [rate, setRate] = useState(FALLBACK_RATE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const cached = getCachedRate()
    if (cached) {
      setRate(cached.rate)
      setLoading(false)
      return () => { cancelled = true }
    }

    async function fetchRate() {
      try {
        const res = await fetch(API_URL)
        if (!res.ok) throw new Error("API error")
        const data = await res.json()
        if (!cancelled && data?.rates?.CNY) {
          const rounded = Math.round(data.rates.CNY * 100) / 100
          setRate(rounded)
          setCachedRate(rounded)
        }
      } catch {
        // Use fallback rate
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchRate()
    return () => { cancelled = true }
  }, [])

  return { rate, loading }
}

export function usdToCny(usd: number, rate: number): number {
  return Math.round(usd * rate * 100) / 100
}

export function cnyToUsd(cny: number, rate: number): number {
  return Math.round((cny / rate) * 100) / 100
}
