import { notFound } from "next/navigation"
import Link from "@/components/ui/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { getContract } from "@/lib/actions/contracts"
import { getTranslations } from "next-intl/server"
import { SealStamp } from "@/components/contracts/seal-stamp"
import { PrintTrigger } from "./print-trigger"
import { PrintButton } from "./print-button"

export default async function ContractDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  const { id } = await params
  const { print } = await searchParams
  const contract = await getContract(id)

  if (!contract) notFound()

  const t = await getTranslations("contracts")

  // Parse date parts for header display
  const d = new Date(contract.created_at)
  const dateParts = {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1).padStart(2, "0"),
    day: String(d.getDate()).padStart(2, "0"),
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="print:hidden flex items-center justify-between">
        <Link href="/seller/contracts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("backToContracts")}
        </Link>
        <PrintButton label={t("printContract")} />
      </div>

      {print === "true" && <PrintTrigger />}

      <div className="contract-print-area">
        {/* ═══════ Professional Header ═══════ */}
        <div className="cnt-header">
          <div className="cnt-header-inner">
            {/* Left: Black side with logo */}
            <div className="cnt-header-left">
              <Image src="/logo.svg" alt="IONE" width={100} height={33} className="cnt-header-logo" />
            </div>
            {/* Center: Seal/stamp */}
            <div className="cnt-header-seal">
              <SealStamp />
            </div>
            {/* Right: Red side with CONTRACT title */}
            <div className="cnt-header-right">
              <span className="cnt-header-title">{t("contractLabel")}</span>
            </div>
            {/* Far right: Contract number */}
            <div className="cnt-header-barcode">
              <span className="cnt-header-barcode-text">{contract.contract_number}</span>
            </div>
          </div>
        </div>

        {/* ═══════ Second row: Date boxes + Contract No. ═══════ */}
        <div className="cnt-date-row">
          <div className="cnt-date-boxes">
            <div className="cnt-date-box">
              <span className="cnt-date-label">{t("year")}</span>
              <span className="cnt-date-value">{dateParts.year}</span>
            </div>
            <div className="cnt-date-box">
              <span className="cnt-date-label">{t("month")}</span>
              <span className="cnt-date-value">{dateParts.month}</span>
            </div>
            <div className="cnt-date-box">
              <span className="cnt-date-label">{t("day")}</span>
              <span className="cnt-date-value">{dateParts.day}</span>
            </div>
          </div>
          <div className="cnt-contract-no">
            <span className="cnt-contract-no-label">{t("contractNumber")}</span>
            <span className="cnt-contract-no-value">{contract.contract_number}</span>
          </div>
        </div>

        {/* ═══════ Body: Parties, Terms, Signatures ═══════ */}
        <div className="contract-print-body">
          {/* Seller & Buyer side by side */}
          <div className="cnt-print-parties">
            <div className="cnt-print-party-box">
              <h4 className="cnt-print-party-title">{t("sellerInformation")}</h4>
              <p><strong>{t("name")}:</strong> {contract.seller?.display_name || "—"}</p>
              {contract.seller_company_name && <p><strong>{t("company")}:</strong> {contract.seller_company_name}</p>}
              <p><strong>{t("email")}:</strong> {contract.seller?.email || "—"}</p>
            </div>
            <div className="cnt-print-party-box">
              <h4 className="cnt-print-party-title">{t("buyerInformation")}</h4>
              <p><strong>{t("name")}:</strong> {contract.buyer_name || "—"}</p>
              {contract.buyer_company_name && <p><strong>{t("company")}:</strong> {contract.buyer_company_name}</p>}
              <p><strong>{t("email")}:</strong> {contract.buyer_email || "—"}</p>
            </div>
          </div>

          {/* Terms & Conditions */}
          {contract.terms && (
            <div className="cnt-print-terms">
              <h4 className="cnt-print-terms-title">{t("termsAndConditions")}</h4>
              <p className="cnt-print-terms-text">{contract.terms}</p>
            </div>
          )}

          {/* Signatures side by side */}
          <div className="cnt-print-signatures">
            <div className="cnt-print-sig-box">
              <span className="cnt-print-sig-label">{t("sellerSignature")}</span>
              {contract.seller_signature ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={contract.seller_signature} alt="Seller Signature" style={{ maxHeight: "60px", margin: "0 auto" }} />
              ) : (
                <div className="cnt-print-sig-line" />
              )}
            </div>
            <div className="cnt-print-sig-box">
              <span className="cnt-print-sig-label">{t("buyerSignature")}</span>
              {contract.buyer_signature ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={contract.buyer_signature} alt="Buyer Signature" style={{ maxHeight: "60px", margin: "0 auto" }} />
              ) : (
                <div className="cnt-print-sig-line" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
