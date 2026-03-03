"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { Select } from "@/components/ui/select"
import { updateOrderStatus } from "@/lib/actions/orders"
import type { OrderStatus } from "@/types/database"

export function StatusUpdate({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
  const t = useTranslations("orders")
  const tCommon = useTranslations("common")
  const [isPending, startTransition] = useTransition()

  const statusOptions: { value: OrderStatus; label: string }[] = [
    { value: "under_review", label: t("underReview") },
    { value: "confirmed", label: t("confirmed") },
    { value: "in_production", label: t("inProduction") },
    { value: "out_of_production", label: t("outOfProduction") },
    { value: "shipped", label: tCommon("shipped") },
    { value: "arrived_at_port", label: t("arrivedAtPort") },
    { value: "delivered", label: tCommon("delivered") },
  ]

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as OrderStatus
    if (!newStatus || newStatus === currentStatus) return
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus)
      window.location.reload()
    })
  }

  return (
    <Select
      options={statusOptions}
      value={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      className="w-48"
    />
  )
}
