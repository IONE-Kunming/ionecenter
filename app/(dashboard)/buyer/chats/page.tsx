import { getCurrentUser } from "@/lib/actions/users"
import { getConversations } from "@/lib/actions/chat"
import { redirect } from "next/navigation"
import ChatClient from "./chat-client"

export default async function BuyerChatsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  const conversations = await getConversations()
  const { id } = await searchParams
  return <ChatClient conversations={conversations} currentUserId={user.id} userRole="buyer" initialConversationId={id} preferredLanguage={user.preferred_language} />
}
