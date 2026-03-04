import { notFound } from "next/navigation"
import Link from "@/components/ui/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate, getIntlLocale } from "@/lib/utils"
import { getContract } from "@/lib/actions/contracts"
import { getTranslations, getLocale } from "next-intl/server"
import { PrintTrigger } from "./print-trigger"
import { PrintButton } from "./print-button"

export default async function ContractDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  const { id } = await params
  const { print } = await searchParams
  const contract = await getContract(id)

  if (!contract) notFound()

  const t = await getTranslations("contracts")
  const tCommon = await getTranslations("common")
  const locale = await getLocale()
  const intlLocale = getIntlLocale(locale)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="print:hidden flex items-center justify-between">
        <Link href="/seller/contracts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("backToContracts")}
        </Link>
        <PrintButton label={t("printContract")} />
      </div>

      {print === "true" && <PrintTrigger />}

      <div className="space-y-6 invoice-print-area">
        {/* Logo centered at top */}
        <div className="invoice-detail-header invoice-print-header">
          <Image src="/logo.svg" alt="IONE Center" width={140} height={46} style={{ margin: "0 auto" }} />
        </div>

        {/* Contract Number, Date, and Expiry Date on same row */}
        <div className="invoice-detail-info-row invoice-info-row">
          <div>
            <p className="text-foreground"><strong>{t("contractNumber")}:</strong> {contract.contract_number}</p>
            <p className="text-foreground"><strong>{t("contractDate")}:</strong> {formatDate(contract.created_at, intlLocale)}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            {contract.expiry_date && (
              <p className="text-foreground"><strong>{t("expiryDate")}:</strong> {formatDate(contract.expiry_date, intlLocale)}</p>
            )}
          </div>
        </div>

        {/* Seller Information */}
        <div className="invoice-detail-section invoice-print-section">
          <h3 className="invoice-detail-section-title invoice-print-section-title text-foreground">{t("sellerInformation")}</h3>
          <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
            <p className="text-foreground"><strong>{t("sellerCode")}:</strong> {contract.seller?.user_code || "—"}</p>
            <p className="text-foreground"><strong>{t("sellerName")}:</strong> {contract.seller?.display_name || "—"}</p>
            <p className="text-foreground"><strong>{t("sellerEmail")}:</strong> {contract.seller?.email || "—"}</p>
          </div>
        </div>

        {/* Buyer Information */}
        <div className="invoice-detail-section invoice-print-section">
          <h3 className="invoice-detail-section-title invoice-print-section-title text-foreground">{t("buyerInformation")}</h3>
          <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
            <p className="text-foreground"><strong>{t("buyerCode")}:</strong> {contract.buyer_code || "—"}</p>
            <p className="text-foreground"><strong>{t("buyerName")}:</strong> {contract.buyer_name || "—"}</p>
            <p className="text-foreground"><strong>{t("buyerEmail")}:</strong> {contract.buyer_email || "—"}</p>
          </div>
        </div>

        {/* Contract Items */}
        {contract.items && contract.items.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold mb-3 text-foreground">{t("contractItems")}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("itemCode")}</TableHead>
                    <TableHead>{t("productName")}</TableHead>
                    <TableHead>{t("description")}</TableHead>
                    <TableHead className="text-right">{t("quantity")}</TableHead>
                    <TableHead>{t("unit")}</TableHead>
                    <TableHead className="text-right">{t("unitPrice")}</TableHead>
                    <TableHead className="text-right">{t("total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contract.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm text-foreground">{item.item_code || "—"}</TableCell>
                      <TableCell className="text-foreground">{item.product_name || "—"}</TableCell>
                      <TableCell className="text-foreground">{item.description || "—"}</TableCell>
                      <TableCell className="text-right text-foreground">{item.quantity}</TableCell>
                      <TableCell className="text-foreground">{item.unit || "—"}</TableCell>
                      <TableCell className="text-right text-foreground">{item.unit_price}</TableCell>
                      <TableCell className="text-right text-foreground">{item.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Terms & Conditions */}
        {contract.terms && (
          <div className="invoice-detail-section invoice-print-section">
            <h3 className="invoice-detail-section-title invoice-print-section-title text-foreground">{t("termsAndConditions")}</h3>
            <div style={{ fontSize: "13px", lineHeight: "1.8", whiteSpace: "pre-wrap" }} className="text-foreground">
              {contract.terms}
            </div>
          </div>
        )}

        {/* Electronic Signatures */}
        <div className="invoice-detail-section invoice-print-section">
          <h3 className="invoice-detail-section-title invoice-print-section-title text-foreground">{t("electronicSignatures")}</h3>
          <div className="grid grid-cols-2 gap-8 mt-4">
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">{t("sellerSignature")}</p>
              <div className="border rounded-md p-2 min-h-[100px] bg-white">
                {contract.seller_signature ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={contract.seller_signature} alt="Seller Signature" className="max-h-[90px]" />
                ) : (
                  <p className="text-muted-foreground text-sm">—</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">{t("buyerSignature")}</p>
              <div className="border rounded-md p-2 min-h-[100px] bg-white">
                {contract.buyer_signature ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={contract.buyer_signature} alt="Buyer Signature" className="max-h-[90px]" />
                ) : (
                  <p className="text-muted-foreground text-sm">—</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
