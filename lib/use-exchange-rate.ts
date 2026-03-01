"use client"

import { useState, useEffect } from "react"

const FALLBACK_RATE = 7.25
const API_URL = "https://open.er-api.com/v6/latest/USD"

interface ExchangeRateResult {
  rate: number
  isLive: boolean
  loading: boolean
}

export function useExchangeRate(): ExchangeRateResult {
  const [rate, setRate] = useState(FALLBACK_RATE)
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchRate() {
      try {
        const res = await fetch(API_URL)
        if (!res.ok) throw new Error("API error")
        const data = await res.json()
        if (!cancelled && data?.rates?.CNY) {
          setRate(data.rates.CNY)
          setIsLive(true)
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

  return { rate, isLive, loading }
}

export function usdToCny(usd: number, rate: number): number {
  return Math.round(usd * rate * 100) / 100
}

export function cnyToUsd(cny: number, rate: number): number {
  return Math.round((cny / rate) * 100) / 100
}
