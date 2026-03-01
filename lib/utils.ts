import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PricingType } from "@/types/database"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatDualPrice(
  priceUsd: number,
  priceCny: number | null,
  pricingType: PricingType = "standard",
  liveRate?: number
): string {
  const usd = formatCurrency(priceUsd, "USD")
  const liveCny = liveRate != null
    ? Math.round(priceUsd * liveRate * 100) / 100
    : priceCny
  const cny = liveCny != null ? formatCurrency(liveCny, "CNY") : null
  const suffix = pricingType === "customized" ? "/m" : ""
  if (cny != null) {
    return `${usd}${suffix} | ${cny}${suffix}`
  }
  return `${usd}${suffix}`
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function getStockStatus(stock: number): { label: string; color: string } {
  if (stock > 400) return { label: "In Stock", color: "green" }
  if (stock > 200) return { label: "Low Stock", color: "yellow" }
  return { label: "Very Low", color: "red" }
}

export const TAX_RATE = 0.10
export const DEPOSIT_OPTIONS = [5, 30, 65, 100] as const

export function calculateOrderTotals(subtotal: number, depositPercentage: number = 100) {
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax
  const depositAmount = total * (depositPercentage / 100)
  const remainingBalance = total - depositAmount
  return { subtotal, tax, total, depositAmount, remainingBalance }
}
