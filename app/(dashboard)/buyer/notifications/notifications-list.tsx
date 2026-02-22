"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Bell, Check, ShoppingCart, CreditCard, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { cn, formatDate } from "@/lib/utils"
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications"
import type { Notification } from "@/types/database"

const typeIcons: Record<string, React.ElementType> = {
  order: ShoppingCart, payment: CreditCard, chat: MessageSquare, system: Bell,
}

export function NotificationsList({ initialNotifications }: { initialNotifications: Notification[] }) {
  const t = useTranslations("notifications")
  const [notifications, setNotifications] = useState(initialNotifications)

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    await markNotificationRead(id)
  }

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await markAllNotificationsRead()
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("unread", { count: unreadCount })}</span>
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}><Check className="h-3.5 w-3.5 mr-1" /> {t("markAllRead")}</Button>
        </div>
      )}

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell
            return (
              <Card key={notif.id} className={cn("cursor-pointer transition-colors", !notif.read && "bg-primary/5 border-primary/20")} onClick={() => handleMarkAsRead(notif.id)}>
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
        <EmptyState icon={Bell} title={t("noNotifications")} description={t("allCaughtUp")} />
      )}
    </div>
  )
}
