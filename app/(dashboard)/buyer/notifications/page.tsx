"use client"

import { useState } from "react"
import { Bell, Check, ShoppingCart, CreditCard, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { cn, formatDate } from "@/lib/utils"

const demoNotifications = [
  { id: "1", type: "order", title: "Order Confirmed", message: "Your order #20000000-0001 has been confirmed.", read: false, created_at: "2025-01-15T10:30:00Z" },
  { id: "2", type: "payment", title: "Payment Received", message: "Your deposit payment of $82.50 has been received.", read: true, created_at: "2025-01-15T10:00:00Z" },
  { id: "3", type: "chat", title: "New Message", message: "Zhang Wei sent you a message about your order.", read: false, created_at: "2025-01-14T15:00:00Z" },
]

const typeIcons: Record<string, React.ElementType> = {
  order: ShoppingCart, payment: CreditCard, chat: MessageSquare, system: Bell,
}

export default function BuyerNotificationsPage() {
  const [notifications, setNotifications] = useState(demoNotifications)

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{unreadCount} unread</span>
          <Button variant="outline" size="sm" onClick={markAllRead}><Check className="h-3.5 w-3.5 mr-1" /> Mark all read</Button>
        </div>
      )}

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell
            return (
              <Card key={notif.id} className={cn("cursor-pointer transition-colors", !notif.read && "bg-primary/5 border-primary/20")} onClick={() => markAsRead(notif.id)}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className={cn("rounded-full p-2", !notif.read ? "bg-primary/10" : "bg-muted")}>
                    <Icon className={cn("h-4 w-4", !notif.read ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={cn("text-sm", !notif.read && "font-semibold")}>{notif.title}</h3>
                      <span className="text-xs text-muted-foreground">{formatDate(notif.created_at)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  </div>
                  {!notif.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      )}
    </div>
  )
}
