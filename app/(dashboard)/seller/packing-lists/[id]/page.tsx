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

export default async function PackingListDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  const { id } = await params
  const { print } = await searchParams
  const packingList = await getPackingList(id)

  if (!packingList) notFound()

  const t = await getTranslations("packingLists")
  const tCommon = await getTranslations("common")
  const locale = await getLocale()
  const intlLocale = getIntlLocale(locale)

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="print:hidden flex items-center justify-between">
        <Link href="/seller/packing-lists" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("backToPackingLists")}
        </Link>
        <PrintButton label={t("printPackingList")} />
      </div>

      {print === "true" && <PrintTrigger />}

      <div className="space-y-6 invoice-print-area">
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
        {packingList.items && packingList.items.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("itemCode")}</TableHead>
                    <TableHead>{t("productName")}</TableHead>
                    <TableHead className="text-right">{t("quantity")}</TableHead>
                    <TableHead>{t("unit")}</TableHead>
                    <TableHead>{t("dimensions")}</TableHead>
                    <TableHead className="text-right">{t("netWeight")}</TableHead>
                    <TableHead className="text-right">{t("grossWeight")}</TableHead>
                    <TableHead>{t("cartonNumber")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packingList.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm text-foreground">{item.item_code || "—"}</TableCell>
                      <TableCell className="text-foreground">{item.product_name || "—"}</TableCell>
                      <TableCell className="text-right text-foreground">{item.quantity}</TableCell>
                      <TableCell className="text-foreground">{item.unit || "—"}</TableCell>
                      <TableCell className="text-foreground">{item.dimensions || "—"}</TableCell>
                      <TableCell className="text-right text-foreground">{item.net_weight} kg</TableCell>
                      <TableCell className="text-right text-foreground">{item.gross_weight} kg</TableCell>
                      <TableCell className="text-foreground">{item.carton_number || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
    </div>
  )
}
