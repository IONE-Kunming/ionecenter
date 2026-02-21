import { getNotifications } from "@/lib/actions/notifications"
import { NotificationsList } from "../../buyer/notifications/notifications-list"

export default async function SellerNotificationsPage() {
  const notifications = await getNotifications()
  return <NotificationsList initialNotifications={notifications} />
}
