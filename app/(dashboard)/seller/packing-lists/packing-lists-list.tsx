"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { PackageCheck, Search, Plus, Eye, Printer, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { useFormatters } from "@/lib/use-formatters"
import { useToast } from "@/components/ui/toaster"
import { deletePackingList } from "@/lib/actions/packing-lists"
import Link from "@/components/ui/link"

interface PackingListRow {
  id: string
  packing_list_number: string
  buyer_name: string
  buyer_email: string
  total_packages: number
  total_net_weight: number
  total_gross_weight: number
  created_at: string
}

export function PackingListsList({ packingLists }: { packingLists: PackingListRow[] }) {
  const t = useTranslations("packingLists")
  const tCommon = useTranslations("common")
  const { formatDate } = useFormatters()
  const { addToast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filtered = packingLists.filter(
    (pl) =>
      !search ||
      pl.packing_list_number.toLowerCase().includes(search.toLowerCase()) ||
      pl.buyer_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (packingListId: string) => {
    startTransition(async () => {
      try {
        const result = await deletePackingList(packingListId)
        if (result.error) {
          addToast("error", result.error)
        } else {
          addToast("success", t("packingListDeleted"))
          router.refresh()
        }
      } catch {
        addToast("error", "Failed to delete packing list")
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
          <Link href="/seller/packing-lists/create">
            <Button><Plus className="h-4 w-4 mr-2" /> {t("createPackingList")}</Button>
          </Link>
        </div>

        {filtered.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("packingListNumber")}</TableHead>
                  <TableHead>{tCommon("date")}</TableHead>
                  <TableHead>{t("buyerName")}</TableHead>
                  <TableHead>{t("buyerEmail")}</TableHead>
                  <TableHead>{t("totalPackages")}</TableHead>
                  <TableHead>{t("totalNetWeight")}</TableHead>
                  <TableHead>{t("totalGrossWeight")}</TableHead>
                  <TableHead>{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((pl) => (
                  <TableRow key={pl.id}>
                    <TableCell className="font-medium">{pl.packing_list_number}</TableCell>
                    <TableCell>{formatDate(pl.created_at)}</TableCell>
                    <TableCell>{pl.buyer_name}</TableCell>
                    <TableCell>{pl.buyer_email}</TableCell>
                    <TableCell>{pl.total_packages}</TableCell>
                    <TableCell>{pl.total_net_weight} kg</TableCell>
                    <TableCell>{pl.total_gross_weight} kg</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/seller/packing-lists/${pl.id}`}>
                          <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        <Link href={`/seller/packing-lists/${pl.id}?print=true`}>
                          <Button variant="ghost" size="sm"><Printer className="h-4 w-4" /></Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => setDeleteTarget(pl.id)}
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
          <EmptyState icon={PackageCheck} title={t("noPackingLists")} />
        )}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deletePackingList")}</DialogTitle>
            <DialogDescription>{t("deletePackingListConfirm")}</DialogDescription>
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
