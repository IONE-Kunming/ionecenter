"use client"

import { useTransition } from "react"

import { Select } from "@/components/ui/select"
import { updateOrderStatus } from "@/lib/actions/orders"
import type { OrderStatus } from "@/types/database"

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "under_review", label: "Under Review" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_production", label: "In Production" },
  { value: "out_of_production", label: "Out of Production" },
  { value: "shipped", label: "Shipped" },
  { value: "arrived_at_port", label: "Arrived at Port" },
  { value: "delivered", label: "Delivered" },
]

export function StatusUpdate({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
  const [isPending, startTransition] = useTransition()

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
