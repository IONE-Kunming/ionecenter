"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { FileSignature, Search, Eye } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { useFormatters } from "@/lib/use-formatters"
import Link from "@/components/ui/link"
import type { ContractStatus } from "@/types/database"

interface ContractRow {
  id: string
  contract_number: string
  buyer_name: string
  buyer_email: string
  status: ContractStatus
  expiry_date: string
  created_at: string
}

function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const t = useTranslations("contracts")
  const colors = {
    draft: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    expired: "bg-red-100 text-red-700",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${colors[status] || colors.draft}`}>
      {t(status)}
    </span>
  )
}

export function BuyerContractsList({ contracts }: { contracts: ContractRow[] }) {
  const t = useTranslations("contracts")
  const tCommon = useTranslations("common")
  const { formatDate } = useFormatters()
  const [search, setSearch] = useState("")

  const filtered = contracts.filter(
    (c) =>
      !search ||
      c.contract_number.toLowerCase().includes(search.toLowerCase()) ||
      c.buyer_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tCommon("search")} className="pl-9" />
        </div>
      </div>

      {filtered.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("contractNumber")}</TableHead>
                <TableHead>{tCommon("date")}</TableHead>
                <TableHead>{t("buyerName")}</TableHead>
                <TableHead>{t("expiryDate")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.contract_number}</TableCell>
                  <TableCell>{formatDate(c.created_at)}</TableCell>
                  <TableCell>{c.buyer_name}</TableCell>
                  <TableCell>{c.expiry_date ? formatDate(c.expiry_date) : "—"}</TableCell>
                  <TableCell><ContractStatusBadge status={c.status} /></TableCell>
                  <TableCell>
                    <Link href={`/buyer/contracts/${c.id}`}>
                      <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState icon={FileSignature} title={t("noContracts")} />
      )}
    </div>
  )
}
