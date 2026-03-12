import { NextResponse } from "next/server"
import { getExchangeRate } from "@/lib/exchange-rate"

export async function GET() {
  try {
    const rate = await getExchangeRate()
    return NextResponse.json({ rate })
  } catch {
    return NextResponse.json({ error: "Failed to fetch exchange rate" }, { status: 503 })
  }
}
