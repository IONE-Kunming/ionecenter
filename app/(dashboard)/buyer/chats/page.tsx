import { getCurrentUser } from "@/lib/actions/users"
import { getConversations } from "@/lib/actions/chat"
import { redirect } from "next/navigation"
import ChatClient from "./chat-client"

export default async function BuyerChatsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  const conversations = await getConversations()
  return <ChatClient conversations={conversations} currentUserId={user.id} userRole="buyer" />
}
