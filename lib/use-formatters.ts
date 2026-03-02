"use client"

import { useLocale } from "next-intl"
import {
  formatCurrency as _formatCurrency,
  formatDate as _formatDate,
  formatDualPrice as _formatDualPrice,
  getIntlLocale,
} from "./utils"
import type { PricingType } from "@/types/database"

/**
 * Returns locale-aware formatCurrency, formatDate, and formatDualPrice functions.
 * When the active locale is Arabic (ar), numbers are rendered with Eastern Arabic
 * numerals (٠١٢٣٤٥٦٧٨٩) via the ar-EG Intl locale.
 */
export function useFormatters() {
  const locale = useLocale()
  const intlLocale = getIntlLocale(locale)

  return {
    formatCurrency: (amount: number, currency = "USD") =>
      _formatCurrency(amount, currency, intlLocale),
    formatDate: (date: Date | string) => _formatDate(date, intlLocale),
    formatDualPrice: (
      priceUsd: number,
      priceCny: number | null,
      pricingType?: PricingType,
      liveRate?: number
    ) => _formatDualPrice(priceUsd, priceCny, pricingType, liveRate, intlLocale),
  }
}
