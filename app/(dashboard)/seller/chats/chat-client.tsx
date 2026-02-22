"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { MessageSquare, Send, Paperclip, FileText, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import { getMessages, sendMessage, sendAttachment } from "@/lib/actions/chat"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import type { Message } from "@/types/database"

interface ConversationParty {
  id: string
  display_name: string
  company: string | null
}

interface ConversationItem {
  id: string
  buyer_id: string
  seller_id: string
  last_message: string | null
  last_message_time: string | null
  buyer?: ConversationParty
  seller?: ConversationParty
}

interface ChatClientProps {
  conversations: ConversationItem[]
  currentUserId: string
  userRole: "buyer" | "seller"
  initialConversationId?: string
}

function relativeTime(dateStr: string | null) {
  if (!dateStr) return ""
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return ""
  }
}

export default function ChatClient({ conversations, currentUserId, userRole, initialConversationId }: ChatClientProps) {
  const t = useTranslations("chat")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState("")
  const [showSidebar, setShowSidebar] = useState(true)
  const [loadingMessages, startLoadMessages] = useTransition()
  const [sending, startSend] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-select conversation from URL param
  useEffect(() => {
    if (initialConversationId && conversations.some((c) => c.id === initialConversationId)) {
      selectConversation(initialConversationId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId])

  // Real-time subscription
  useEffect(() => {
    if (!selectedId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`chat:${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            // Replace optimistic message from self if exists
            if (newMsg.sender_id === currentUserId) {
              const hasTemp = prev.some((m) => m.id.startsWith("temp-"))
              if (hasTemp) {
                return prev.map((m) => (m.id.startsWith("temp-") ? newMsg : m))
              }
              return prev
            }
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedId, currentUserId])

  function otherParty(conv: ConversationItem): ConversationParty {
    if (conv.buyer_id === currentUserId) return conv.seller ?? { id: conv.seller_id, display_name: "User", company: null }
    return conv.buyer ?? { id: conv.buyer_id, display_name: "User", company: null }
  }

  function selectConversation(id: string) {
    setSelectedId(id)
    setShowSidebar(false)
    setMessages([])
    startLoadMessages(async () => {
      const msgs = await getMessages(id)
      setMessages(msgs)
    })
  }

  function handleSend() {
    if (!message.trim() || !selectedId) return
    const text = message.trim()
    setMessage("")
    // Optimistic update
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedId,
      sender_id: currentUserId,
      text,
      type: "text",
      file_url: null,
      file_name: null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    startSend(async () => {
      const result = await sendMessage(selectedId, text)
      if (result.message) {
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? result.message! : m)))
      }
    })
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedId) return

    const isImage = file.type.startsWith("image/")
    const isPdf = file.type === "application/pdf"
    if (!isImage && !isPdf) return

    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("conversationId", selectedId)
      const result = await sendAttachment(formData)
      if (result.error) {
        setUploadError(result.error)
      } else if (result.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === result.message!.id)) return prev
          return [...prev, result.message!]
        })
      }
    } catch {
      setUploadError("Failed to upload file")
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const selected = conversations.find((c) => c.id === selectedId)
  const selectedOther = selected ? otherParty(selected) : null

  return (
    <div className="flex h-[calc(100vh-12rem)] rounded-xl border overflow-hidden">
      {/* Conversation List */}
      <div className={cn("w-full md:w-80 border-r bg-card flex flex-col", selectedId && !showSidebar && "hidden md:flex")}>
        <div className="p-4 border-b">
          <h2 className="font-semibold">{t("conversations")}</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <EmptyState icon={MessageSquare} title={t("noConversations")} description={t("noConversationsDesc")} className="py-8" />
          ) : (
            conversations.map((conv) => {
              const other = otherParty(conv)
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-4 border-b hover:bg-accent transition-colors text-left",
                    selectedId === conv.id && "bg-accent"
                  )}
                >
                  <Avatar alt={other.display_name} fallback={other.display_name.charAt(0)} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{other.display_name}</span>
                      <span className="text-xs text-muted-foreground">{relativeTime(conv.last_message_time)}</span>
                    </div>
                    {other.company && <p className="text-xs text-muted-foreground">{other.company}</p>}
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message ?? "No messages yet"}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn("flex-1 flex flex-col", !selectedId && "hidden md:flex")}>
        {selectedId && selectedOther ? (
          <>
            <div className="flex items-center gap-3 p-4 border-b">
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setShowSidebar(true)}>←</Button>
              <Avatar alt={selectedOther.display_name} fallback={selectedOther.display_name.charAt(0)} size="sm" />
              <div>
                <p className="font-medium text-sm">{selectedOther.display_name}</p>
                {selectedOther.company && <p className="text-xs text-muted-foreground">{selectedOther.company}</p>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages && messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">Loading messages...</p>
              )}
              {messages.map((msg) => {
                const isMe = msg.sender_id === currentUserId
                return (
                  <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[70%] rounded-lg px-4 py-2 text-sm", isMe ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      {msg.type === "image" && msg.file_url ? (
                        <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                          <img src={msg.file_url} alt={msg.file_name ?? "Image"} className="max-w-full rounded max-h-60 object-contain" />
                        </a>
                      ) : msg.type === "pdf" && msg.file_url ? (
                        <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{msg.file_name ?? "Document.pdf"}</span>
                        </a>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                      <p className={cn("text-xs mt-1", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {relativeTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
            {uploadError && (
              <div className="px-4 py-2 text-xs text-destructive bg-destructive/10">{uploadError}</div>
            )}
            <div className="p-4 border-t flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                size="icon"
                variant="ghost"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </Button>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("typeMessage")}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              />
              <Button size="icon" disabled={!message.trim() || sending} onClick={handleSend}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <EmptyState icon={MessageSquare} title="Select a conversation" description="Choose a conversation from the sidebar." className="flex-1" />
        )}
      </div>
    </div>
  )
}
