"use client"

import { useState } from "react"
import { Building2, Plus, Pencil, Trash2, MapPin, Phone, Mail } from "lucide-react"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import type { Branch } from "@/types/database"

export function BranchesList({ initialBranches }: { initialBranches: Branch[] }) {
  const t = useTranslations("branches")
  const tCommon = useTranslations("common")
  const [branches] = useState(initialBranches)
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><Button onClick={() => setShowAddModal(true)} className="gap-2"><Plus className="h-4 w-4" /> {t("addBranch")}</Button></div>

      {branches.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <Card key={branch.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{branch.name}</h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </div>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {branch.address}, {branch.city}, {branch.state}, {branch.country}</p>
                  {branch.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {branch.phone}</p>}
                  {branch.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {branch.email}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (<EmptyState icon={Building2} title={t("noBranches")} action={{ label: t("addBranch"), onClick: () => setShowAddModal(true) }} />)}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("addBranch")}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2"><Label>{t("branchName")}</Label><Input placeholder={t("branchNamePlaceholder")} /></div>
            <div className="space-y-2"><Label>{t("address")}</Label><Input placeholder={t("streetPlaceholder")} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("city")}</Label><Input placeholder={t("cityPlaceholder")} /></div>
              <div className="space-y-2"><Label>{t("state")}</Label><Input placeholder={t("statePlaceholder")} /></div>
            </div>
            <div className="space-y-2"><Label>{t("country")}</Label><Input placeholder={t("countryPlaceholder")} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("phone")}</Label><Input placeholder={t("phonePlaceholder")} /></div>
              <div className="space-y-2"><Label>{t("email")}</Label><Input type="email" placeholder={t("emailPlaceholder")} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>{tCommon("cancel")}</Button>
            <Button onClick={() => setShowAddModal(false)}>{t("addBranch")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
