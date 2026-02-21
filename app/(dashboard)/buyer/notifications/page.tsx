import { getNotifications } from "@/lib/actions/notifications"
import { NotificationsList } from "./notifications-list"

export default async function BuyerNotificationsPage() {
  const notifications = await getNotifications()
  return <NotificationsList initialNotifications={notifications} />
}
