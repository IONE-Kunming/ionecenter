"use client"

import { useState } from "react"
import { MessageSquare, Send, Paperclip, Image } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

const demoConversations = [
  { id: "1", name: "Zhang Wei", company: "Kunming Aluminum Co.", lastMessage: "The profiles are ready for shipment.", time: "10:30 AM", unread: true },
  { id: "2", name: "Ahmed Hassan", company: "Gulf Aluminum Industries", lastMessage: "Thank you for your order!", time: "Yesterday", unread: false },
]

const demoMessages = [
  { id: "1", senderId: "seller", text: "Hello! How can I help you today?", time: "10:00 AM" },
  { id: "2", senderId: "me", text: "I'm interested in the Premium Window Profile. Can you provide bulk pricing?", time: "10:15 AM" },
  { id: "3", senderId: "seller", text: "Absolutely! For orders over 100 units, we offer a 10% discount. The profiles are ready for shipment.", time: "10:30 AM" },
]

export default function SellerChatsPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>("1")
  const [message, setMessage] = useState("")
  const [showSidebar, setShowSidebar] = useState(true)

  return (
    <div className="flex h-[calc(100vh-12rem)] rounded-xl border overflow-hidden">
      {/* Conversation List */}
      <div className={cn("w-full md:w-80 border-r bg-card flex flex-col", selectedConversation && !showSidebar && "hidden md:flex")}>
        <div className="p-4 border-b">
          <h2 className="font-semibold">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {demoConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => { setSelectedConversation(conv.id); setShowSidebar(false) }}
              className={cn(
                "w-full flex items-start gap-3 p-4 border-b hover:bg-accent transition-colors text-left",
                selectedConversation === conv.id && "bg-accent"
              )}
            >
              <Avatar alt={conv.name} fallback={conv.name.charAt(0)} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm", conv.unread && "font-semibold")}>{conv.name}</span>
                  <span className="text-xs text-muted-foreground">{conv.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread && <div className="h-2 w-2 rounded-full bg-primary mt-2" />}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn("flex-1 flex flex-col", !selectedConversation && "hidden md:flex")}>
        {selectedConversation ? (
          <>
            <div className="flex items-center gap-3 p-4 border-b">
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setShowSidebar(true)}>←</Button>
              <Avatar alt="Zhang Wei" fallback="Z" size="sm" />
              <div><p className="font-medium text-sm">Zhang Wei</p><p className="text-xs text-muted-foreground">Kunming Aluminum Co.</p></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {demoMessages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.senderId === "me" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[70%] rounded-lg px-4 py-2 text-sm", msg.senderId === "me" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    <p>{msg.text}</p>
                    <p className={cn("text-xs mt-1", msg.senderId === "me" ? "text-primary-foreground/70" : "text-muted-foreground")}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2">
              <Button variant="ghost" size="icon"><Paperclip className="h-4 w-4" /></Button>
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1" onKeyDown={(e) => e.key === "Enter" && message && setMessage("")} />
              <Button size="icon" disabled={!message}><Send className="h-4 w-4" /></Button>
            </div>
          </>
        ) : (
          <EmptyState icon={MessageSquare} title="Select a conversation" description="Choose a conversation from the sidebar." className="flex-1" />
        )}
      </div>
    </div>
  )
}
