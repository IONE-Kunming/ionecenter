"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Select } from "@/components/ui/select"
import { updateOrderStatus } from "@/lib/actions/orders"
import type { OrderStatus } from "@/types/database"

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Under Review" },
  { value: "processing", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
]

export function StatusUpdate({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as OrderStatus
    if (!newStatus || newStatus === currentStatus) return
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus)
      router.refresh()
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
