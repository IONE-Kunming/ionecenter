import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PricingType } from "@/types/database"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatDualPrice(
  priceUsd: number,
  priceCny: number | null,
  pricingType: PricingType = "standard",
  rate?: number,
  locale = "en-US"
): string {
  const usd = formatCurrency(priceUsd, "USD", locale)
  const convertedCny = rate != null
    ? Math.round(priceUsd * rate * 100) / 100
    : priceCny
  const cny = convertedCny != null ? formatCurrency(convertedCny, "CNY", locale) : null
  const suffix = pricingType === "customized" ? "/m" : ""
  if (cny != null) {
    return `${usd}${suffix} | ${cny}${suffix}`
  }
  return `${usd}${suffix}`
}

export function formatDate(date: Date | string, locale = "en-US"): string {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/** Returns the Intl locale string for formatting numbers/dates (Arabic → ar-EG for Eastern Arabic numerals). */
export function getIntlLocale(locale: string): string {
  return locale === "ar" ? "ar-EG" : locale
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
