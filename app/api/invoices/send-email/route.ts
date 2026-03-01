import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getCurrentUser } from "@/lib/actions/users"

const BANK_INFO = {
  accountHolder: "HK KANDIVAN INTERNATIONAL TRADING COMPANY LIMITED",
  accountNumber: "342801259",
  swiftCode: "CITIHKHX",
  bankName: "CITIBANK N.A. HONG KONG BRANCH",
  bankRegion: "HK",
  bankCode: "006",
  branchCode: "391",
  bankAddress: "Champion Tower, THREE Garden Road, Central, Hong Kong 🇭🇰",
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service not configured. Set RESEND_API_KEY in environment variables." },
      { status: 500 }
    )
  }

  const body = await request.json()
  const { buyerEmail, buyerName, invoiceNumber, invoiceDate, items, subtotal, discount, total, amountPaid, amountDue } = body

  if (!buyerEmail || !invoiceNumber) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const itemRows = (items as { name: string; description: string; unitPrice: number; quantity: number; total: number }[])
    .map(
      (item, i) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">RX${String(i + 1).padStart(3, "0")} — ${escapeHtml(item.name)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.description)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">$${Number(item.unitPrice).toFixed(2)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">$${Number(item.total).toFixed(2)}</td>
        </tr>`
    )
    .join("")

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;color:#333;">
      <div style="text-align:center;padding:20px 0;border-bottom:2px solid #e11d48;">
        <h1 style="color:#e11d48;margin:0;">IONE Center</h1>
      </div>
      <div style="padding:20px 0;">
        <h2 style="margin:0 0 4px;">Invoice ${escapeHtml(invoiceNumber)}</h2>
        <p style="color:#666;margin:0;">Date: ${escapeHtml(invoiceDate)}</p>
      </div>
      <div style="padding:0 0 20px;">
        <p style="margin:0 0 2px;"><strong>Bill To:</strong></p>
        <p style="margin:0 0 2px;">${escapeHtml(buyerName)}</p>
        <p style="margin:0;color:#666;">${escapeHtml(buyerEmail)}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Item</th>
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Description</th>
            <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb;">Unit Price</th>
            <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb;">Qty</th>
            <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div style="max-width:300px;margin-left:auto;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Subtotal</span><span>$${Number(subtotal).toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Discount</span><span>-$${Number(discount).toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #e5e7eb;font-weight:bold;"><span>Total</span><span>$${Number(total).toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;color:#16a34a;"><span>Amount Paid</span><span>$${Number(amountPaid).toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #e5e7eb;font-weight:bold;font-size:1.1em;"><span>Amount Due</span><span>$${Number(amountDue).toFixed(2)}</span></div>
      </div>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-top:20px;">
        <h3 style="margin:0 0 8px;">Bank Information</h3>
        <p style="margin:2px 0;font-size:14px;"><strong>Account Holder:</strong> ${BANK_INFO.accountHolder}</p>
        <p style="margin:2px 0;font-size:14px;"><strong>Account Number:</strong> ${BANK_INFO.accountNumber}</p>
        <p style="margin:2px 0;font-size:14px;"><strong>SWIFT/BIC Code:</strong> ${BANK_INFO.swiftCode}</p>
        <p style="margin:2px 0;font-size:14px;"><strong>Bank Name:</strong> ${BANK_INFO.bankName}</p>
        <p style="margin:2px 0;font-size:14px;"><strong>Bank Region:</strong> ${BANK_INFO.bankRegion}</p>
        <p style="margin:2px 0;font-size:14px;"><strong>Bank Code:</strong> ${BANK_INFO.bankCode}</p>
        <p style="margin:2px 0;font-size:14px;"><strong>Branch Code:</strong> ${BANK_INFO.branchCode}</p>
        <p style="margin:2px 0;font-size:14px;"><strong>Bank Address:</strong> ${BANK_INFO.bankAddress}</p>
      </div>
    </div>
  `

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: "IONE Center <invoices@ionecenter.com>",
      to: [buyerEmail],
      subject: `Invoice ${invoiceNumber} from IONE Center`,
      html,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send email" },
      { status: 500 }
    )
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
