"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { FileSignature, Search, Plus, Eye, Printer, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { useFormatters } from "@/lib/use-formatters"
import { useToast } from "@/components/ui/toaster"
import { deleteContract } from "@/lib/actions/contracts"
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

export function ContractsList({ contracts }: { contracts: ContractRow[] }) {
  const t = useTranslations("contracts")
  const tCommon = useTranslations("common")
  const { formatDate } = useFormatters()
  const { addToast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filtered = contracts.filter(
    (c) =>
      !search ||
      c.contract_number.toLowerCase().includes(search.toLowerCase()) ||
      c.buyer_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (contractId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteContract(contractId)
        if (result.error) {
          addToast("error", result.error)
        } else {
          addToast("success", t("contractDeleted"))
          router.refresh()
        }
      } catch {
        addToast("error", "Failed to delete contract")
      }
    })
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tCommon("search")} className="pl-9" />
          </div>
          <Link href="/seller/contracts/create">
            <Button><Plus className="h-4 w-4 mr-2" /> {t("createContract")}</Button>
          </Link>
        </div>

        {filtered.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("contractNumber")}</TableHead>
                  <TableHead>{tCommon("date")}</TableHead>
                  <TableHead>{t("buyerName")}</TableHead>
                  <TableHead>{t("buyerEmail")}</TableHead>
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
                    <TableCell>{c.buyer_email}</TableCell>
                    <TableCell>{c.expiry_date ? formatDate(c.expiry_date) : "—"}</TableCell>
                    <TableCell><ContractStatusBadge status={c.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/seller/contracts/${c.id}`}>
                          <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        <Link href={`/seller/contracts/${c.id}?print=true`}>
                          <Button variant="ghost" size="sm"><Printer className="h-4 w-4" /></Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => setDeleteTarget(c.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteContract")}</DialogTitle>
            <DialogDescription>{t("deleteContractConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                if (deleteTarget) {
                  handleDelete(deleteTarget)
                  setDeleteTarget(null)
                }
              }}
            >
              {tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
