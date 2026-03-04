import { notFound } from "next/navigation"
import Link from "@/components/ui/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate, getIntlLocale } from "@/lib/utils"
import { getPackingList } from "@/lib/actions/packing-lists"
import { getTranslations, getLocale } from "next-intl/server"
import { PrintTrigger } from "./print-trigger"
import { PrintButton } from "./print-button"
import { BarcodeCanvas } from "./barcode"
import { SetPageTitle } from "@/components/layout/page-title-context"

export default async function PackingListDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  const { id } = await params
  const { print } = await searchParams
  const packingList = await getPackingList(id)

  if (!packingList) notFound()

  const t = await getTranslations("packingLists")
  const tCommon = await getTranslations("common")
  const locale = await getLocale()
  const intlLocale = getIntlLocale(locale)

  const createdDate = new Date(packingList.created_at)
  const year = createdDate.getFullYear()
  const month = String(createdDate.getMonth() + 1).padStart(2, "0")
  const day = String(createdDate.getDate()).padStart(2, "0")

  const sellerAddress = [
    packingList.seller?.street,
    packingList.seller?.city,
    packingList.seller?.state,
    packingList.seller?.zip,
    packingList.seller?.country,
  ].filter(Boolean).join(", ")
  const sellerPhone = packingList.seller?.phone_number || ""

  /* Compute totals for the print summary bar */
  const items = packingList.items ?? []
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0)
  /* CBM: if item has height/length/width, compute per-item CBM; otherwise fall back to 0 */
  let totalCBM = 0
  for (const item of items) {
    const h = item.height ?? 0
    const l = item.length ?? 0
    const w = item.width ?? 0
    if (h && l && w) {
      totalCBM += (l * w * h) / 1_000_000 * item.quantity
    }
  }
  totalCBM = Number(totalCBM.toFixed(4))

  return (
    <div className="space-y-6 max-w-5xl">
      <SetPageTitle title={`${t("packingList")} ${packingList.packing_list_number}`} />
      {/* ---- Screen-only navigation ---- */}
      <div className="print:hidden flex items-center justify-between">
        <Link href="/seller/packing-lists" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("backToPackingLists")}
        </Link>
        <PrintButton label={t("printPackingList")} />
      </div>

      {print === "true" && <PrintTrigger />}

      {/* ---- Screen layout (hidden in print) ---- */}
      <div className="space-y-6 invoice-print-area packing-screen-only">
        {/* Logo centered at top */}
        <div className="invoice-detail-header invoice-print-header">
          <Image src="/logo.svg" alt="IONE Center" width={140} height={46} style={{ margin: "0 auto" }} />
        </div>

        {/* Packing List Number and Date on same row */}
        <div className="invoice-detail-info-row invoice-info-row">
          <div>
            <p className="text-foreground"><strong>{t("packingListNumber")}:</strong> {packingList.packing_list_number}</p>
            <p className="text-foreground"><strong>{tCommon("date")}:</strong> {formatDate(packingList.created_at, intlLocale)}</p>
          </div>
        </div>

        {/* Seller and Buyer Information side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seller Information */}
          <div className="invoice-detail-section invoice-print-section">
            <h3 className="invoice-detail-section-title invoice-print-section-title text-foreground">{t("sellerInformation")}</h3>
            <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
              <p className="text-foreground"><strong>{t("sellerCode")}:</strong> {packingList.seller?.user_code || "—"}</p>
              <p className="text-foreground"><strong>{t("sellerName")}:</strong> {packingList.seller?.display_name || "—"}</p>
              <p className="text-foreground"><strong>{t("sellerEmail")}:</strong> {packingList.seller?.email || "—"}</p>
            </div>
          </div>

          {/* Buyer Information */}
          <div className="invoice-detail-section invoice-print-section">
            <h3 className="invoice-detail-section-title invoice-print-section-title text-foreground">{t("buyerInformation")}</h3>
            <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
              <p className="text-foreground"><strong>{t("buyerCode")}:</strong> {packingList.buyer_code || "—"}</p>
              <p className="text-foreground"><strong>{t("buyerName")}:</strong> {packingList.buyer_name || "—"}</p>
              <p className="text-foreground"><strong>{t("buyerEmail")}:</strong> {packingList.buyer_email || "—"}</p>
            </div>
          </div>
        </div>

        {/* Packing Items Table */}
        {items.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NO</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>H</TableHead>
                    <TableHead>L</TableHead>
                    <TableHead>W</TableHead>
                    <TableHead className="text-right">QTY</TableHead>
                    <TableHead className="text-right">WEIGHT</TableHead>
                    <TableHead className="text-right">TOTAL WEIGHT</TableHead>
                    <TableHead className="text-right">GROSS WEIGHT</TableHead>
                    <TableHead className="text-right">CBM</TableHead>
                    <TableHead className="text-right">TOTAL CBM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => {
                    const h = item.height ?? 0
                    const l = item.length ?? 0
                    const w = item.width ?? 0
                    const hasDims = h > 0 && l > 0 && w > 0
                    const totalWeight = (item.net_weight * item.quantity).toFixed(2)
                    const itemCBM = hasDims
                      ? ((l * w * h) / 1_000_000).toFixed(4)
                      : "—"
                    const itemTotalCBM = hasDims
                      ? ((l * w * h) / 1_000_000 * item.quantity).toFixed(4)
                      : "—"
                    return (
                    <TableRow key={item.id}>
                      <TableCell className="text-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-sm text-foreground">{item.item_code || "—"}</TableCell>
                      <TableCell className="text-foreground">{h || "—"}</TableCell>
                      <TableCell className="text-foreground">{l || "—"}</TableCell>
                      <TableCell className="text-foreground">{w || "—"}</TableCell>
                      <TableCell className="text-right text-foreground">{item.quantity}</TableCell>
                      <TableCell className="text-right text-foreground">{item.net_weight}</TableCell>
                      <TableCell className="text-right text-foreground">{totalWeight}</TableCell>
                      <TableCell className="text-right text-foreground">{item.gross_weight}</TableCell>
                      <TableCell className="text-right text-foreground">{itemCBM}</TableCell>
                      <TableCell className="text-right text-foreground">{itemTotalCBM}</TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card className="invoice-summary-card">
          <CardContent className="space-y-2 text-sm max-w-sm ml-auto pt-6">
            <div className="flex justify-between">
              <span className="text-foreground">{t("totalPackages")}</span>
              <span className="font-medium text-foreground">{packingList.total_packages}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">{t("totalNetWeight")}</span>
              <span className="font-medium text-foreground">{packingList.total_net_weight} kg</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span className="text-foreground">{t("totalGrossWeight")}</span>
              <span className="text-foreground">{packingList.total_gross_weight} kg</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==== PRINT-ONLY Professional Layout ==== */}
      <div className="hidden packing-print-layout">
        {/* ---- Header Row ---- */}
        <div className="pkl-header">
          <div className="pkl-header-logo">
            <Image src="/logo.svg" alt="IONE Center" width={140} height={46} />
          </div>
          <div className="pkl-header-stamp">
            <Image src="/stamp.svg" alt="Stamp" width={80} height={80} />
          </div>
          <div className="pkl-header-title">
            <span>PACKING LIST</span>
          </div>
          <div className="pkl-header-barcode">
            <BarcodeCanvas value={packingList.packing_list_number} height={40} width={1.2} />
          </div>
        </div>

        {/* ---- Date and Invoice Row ---- */}
        <div className="pkl-date-row">
          <div className="pkl-date-boxes">
            <div className="pkl-date-box">
              <span className="pkl-date-label">Year</span>
              <span className="pkl-date-value">{year}</span>
            </div>
            <div className="pkl-date-box">
              <span className="pkl-date-label">Month</span>
              <span className="pkl-date-value">{month}</span>
            </div>
            <div className="pkl-date-box">
              <span className="pkl-date-label">Day</span>
              <span className="pkl-date-value">{day}</span>
            </div>
          </div>
          <div className="pkl-invoice-box">
            <span className="pkl-invoice-label">Invoice No.</span>
            <span className="pkl-invoice-value">{packingList.packing_list_number}</span>
          </div>
        </div>

        {/* ---- Buyer and Seller Row ---- */}
        <div className="pkl-parties-row">
          <div className="pkl-party-box">
            <span className="pkl-party-label">BUYER</span>
            <span className="pkl-party-code">IONE CODE: {packingList.buyer_code || "—"}</span>
          </div>
          <div className="pkl-party-box">
            <span className="pkl-party-label">SELLER</span>
            <span className="pkl-party-code">IONE CODE: {packingList.seller?.user_code || "—"}</span>
          </div>
        </div>

        {/* ---- Section Title ---- */}
        <div className="pkl-section-title">
          ORDER DETAILS PAGE 2
        </div>

        {/* ---- Packing Items Table ---- */}
        {items.length > 0 && (
          <table className="pkl-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>SKU</th>
                <th>H</th>
                <th>L</th>
                <th>W</th>
                <th>QTY</th>
                <th>WEIGHT</th>
                <th>TOTAL WEIGHT</th>
                <th>GROSS WEIGHT</th>
                <th>CBM</th>
                <th>TOTAL CBM</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const h = item.height ?? 0
                const l = item.length ?? 0
                const w = item.width ?? 0
                const hasDims = h > 0 && l > 0 && w > 0
                const itemCBM = hasDims
                  ? ((l * w * h) / 1_000_000).toFixed(4)
                  : "—"
                const itemTotalCBM = hasDims
                  ? ((l * w * h) / 1_000_000 * item.quantity).toFixed(4)
                  : "—"
                return (
                  <tr key={item.id} className={idx % 2 === 1 ? "pkl-row-alt" : ""}>
                    <td>{idx + 1}</td>
                    <td>{item.item_code || "—"}</td>
                    <td>{h || "—"}</td>
                    <td>{l || "—"}</td>
                    <td>{w || "—"}</td>
                    <td className="pkl-qty">{item.quantity}</td>
                    <td>{item.net_weight}</td>
                    <td>{(item.net_weight * item.quantity).toFixed(2)}</td>
                    <td>{item.gross_weight}</td>
                    <td>{itemCBM}</td>
                    <td>{itemTotalCBM}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* ---- Summary Footer Bar ---- */}
        <div className="pkl-summary-bar">
          <span>TOTAL KG: {packingList.total_gross_weight} KG</span>
          <span className="pkl-summary-sep">—</span>
          <span>TOTAL CBM: {totalCBM} CBM</span>
          <span className="pkl-summary-sep">—</span>
          <span>TOTAL QUANTITY: {totalQty} CTN</span>
        </div>

        {/* ---- Bottom Footer ---- */}
        <div className="pkl-footer">
          <div className="pkl-footer-left">
            {sellerAddress && <span>{sellerAddress}</span>}
            {sellerPhone && <span>{sellerPhone}</span>}
          </div>
          <div className="pkl-footer-right">
            WWW.IONECENTER.COM
          </div>
        </div>
      </div>
    </div>
  )
}
