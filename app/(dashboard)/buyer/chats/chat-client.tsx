"use client"

import { useState, useTransition, useRef, useEffect, useCallback, useMemo } from "react"
import { useTranslations } from "next-intl"
import { MessageSquare, Send, Paperclip, FileText, Loader2, Languages, Image as ImageIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/empty-state"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { getMessages, sendMessage, sendAttachment } from "@/lib/actions/chat"
import { translateText } from "@/lib/translate"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
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
  last_message_at: string | null
  buyer?: ConversationParty
  seller?: ConversationParty
}

interface ChatClientProps {
  conversations: ConversationItem[]
  currentUserId: string
  userRole: "buyer" | "seller"
  initialConversationId?: string
  preferredLanguage: string
}

const TRANSLATE_LANGUAGES = [
  { value: "default", labelKey: "defaultLanguage" },
  { value: "en", labelKey: "english" },
  { value: "zh", labelKey: "chinese" },
  { value: "ar", labelKey: "arabic" },
  { value: "ur", labelKey: "urdu" },
] as const

function formatMessageTime(dateStr: string | null) {
  if (!dateStr) return ""
  try {
    const date = new Date(dateStr)
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const parts = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(date)
    const shortTz = parts.find((p) => p.type === "timeZoneName")?.value ?? ""
    return `${format(date, "MMM d, yyyy h:mm a")} ${shortTz} (${timeZone})`
  } catch {
    return ""
  }
}

export default function ChatClient({ conversations, currentUserId, userRole, initialConversationId, preferredLanguage }: ChatClientProps) {
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

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null)

  // Translation state
  const [translateLang, setTranslateLang] = useState<string | null>(null)
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set())
  // Separate state for individual right-click translations (persists when bulk translation is off)
  const [contextTranslations, setContextTranslations] = useState<Record<string, string>>({})

  const resolvedLang = translateLang === "default" ? preferredLanguage : translateLang

  // Translate all text messages when language changes
  const translateAllMessages = useCallback(
    async (msgs: Message[], targetLang: string) => {
      const textMsgs = msgs.filter((m) => m.type === "text" && m.text)
      if (textMsgs.length === 0) return

      setTranslatingIds(new Set(textMsgs.map((m) => m.id)))

      const results: Record<string, string> = {}
      await Promise.all(
        textMsgs.map(async (msg) => {
          try {
            const translated = await translateText(msg.text!, targetLang)
            results[msg.id] = translated
          } catch {
            results[msg.id] = t("translationFailed")
          }
        })
      )

      setTranslatingIds(new Set())
      setTranslations((prev) => ({ ...prev, ...results }))
    },
    [t]
  )

  // When translate language changes, re-translate all messages
  useEffect(() => {
    if (!resolvedLang) {
      setTranslations({})
      setTranslatingIds(new Set())
      return
    }
    translateAllMessages(messages, resolvedLang)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedLang])

  // Translate a single new message if translation is active
  const translateSingleMessage = useCallback(
    async (msg: Message) => {
      if (!resolvedLang || msg.type !== "text" || !msg.text) return
      setTranslatingIds((prev) => new Set(prev).add(msg.id))
      try {
        const translated = await translateText(msg.text, resolvedLang)
        setTranslations((prev) => ({ ...prev, [msg.id]: translated }))
      } catch {
        setTranslations((prev) => ({ ...prev, [msg.id]: t("translationFailed") }))
      } finally {
        setTranslatingIds((prev) => {
          const next = new Set(prev)
          next.delete(msg.id)
          return next
        })
      }
    },
    [resolvedLang, t]
  )

  function handleTranslateSelect(langValue: string) {
    if (langValue === translateLang) {
      // Toggle off if same language selected again
      setTranslateLang(null)
    } else {
      setTranslateLang(langValue)
    }
  }

  function handleContextMenuTranslate(messageId: string, langValue: string) {
    const msg = messages.find((m) => m.id === messageId)
    if (!msg || msg.type !== "text" || !msg.text) return
    setContextMenu(null)
    const targetLang = langValue === "default" ? preferredLanguage : langValue
    if (!targetLang) return
    setTranslatingIds((prev) => new Set(prev).add(messageId))
    translateText(msg.text, targetLang)
      .then((translated) => {
        setContextTranslations((prev) => ({ ...prev, [messageId]: translated }))
      })
      .catch(() => {
        setContextTranslations((prev) => ({ ...prev, [messageId]: t("translationFailed") }))
      })
      .finally(() => {
        setTranslatingIds((prev) => {
          const next = new Set(prev)
          next.delete(messageId)
          return next
        })
      })
  }

  useEffect(() => {
    if (!contextMenu) return
    const handler = () => setContextMenu(null)
    window.addEventListener("click", handler)
    return () => window.removeEventListener("click", handler)
  }, [contextMenu])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-select conversation from URL param
  useEffect(() => {
    if (initialConversationId && conversations.some((c) => c.id === initialConversationId)) {
      setSelectedId(initialConversationId)
      setShowSidebar(false)
      setMessages([])
      setTranslations({})
      setContextTranslations({})
      setTranslateLang(null)
      startLoadMessages(async () => {
        const msgs = await getMessages(initialConversationId)
        setMessages(msgs)
      })
    }
  }, [initialConversationId, conversations])

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
          // Auto-translate new incoming messages
          if (newMsg.sender_id !== currentUserId) {
            translateSingleMessage(newMsg)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedId, currentUserId, translateSingleMessage])

  function otherParty(conv: ConversationItem): ConversationParty {
    if (conv.buyer_id === currentUserId) return conv.seller ?? { id: conv.seller_id, display_name: "User", company: null }
    return conv.buyer ?? { id: conv.buyer_id, display_name: "User", company: null }
  }

  function selectConversation(id: string) {
    setSelectedId(id)
    setShowSidebar(false)
    setMessages([])
    setTranslations({})
    setContextTranslations({})
    setTranslateLang(null)
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
        // Translate the sent message too
        translateSingleMessage(result.message)
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
      setUploadError(t("failedUpload"))
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const selected = conversations.find((c) => c.id === selectedId)
  const selectedOther = selected ? otherParty(selected) : null

  // Media & attachments for the selected conversation (images and PDFs sorted by date)
  const mediaMessages = useMemo(
    () => messages.filter((m) => (m.type === "image" || m.type === "pdf") && m.file_url).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [messages]
  )

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
                    "w-full flex items-start gap-3 p-4 border-b hover:bg-accent transition-colors text-left dark:hover:text-black",
                    selectedId === conv.id && "bg-accent dark:text-black"
                  )}
                >
                  <Avatar alt={other.display_name} fallback={other.display_name.charAt(0)} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{other.display_name}</span>
                      <span className="text-xs">{formatMessageTime(conv.last_message_at)}</span>
                    </div>
                    {other.company && <p className="text-xs">{other.company}</p>}
                    <p className="text-xs truncate">{conv.last_message ?? t("noMessagesYet")}</p>
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
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{selectedOther.display_name}</p>
                {selectedOther.company && <p className="text-xs text-muted-foreground">{selectedOther.company}</p>}
              </div>
              {/* Translation dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Languages className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("translateTo")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {TRANSLATE_LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                      key={lang.value}
                      onClick={() => handleTranslateSelect(lang.value)}
                      className={cn(translateLang === lang.value && "bg-accent font-medium")}
                    >
                      {t(lang.labelKey)}
                    </DropdownMenuItem>
                  ))}
                  {translateLang && (
                    <DropdownMenuItem
                      onClick={() => setTranslateLang(null)}
                      className="text-muted-foreground border-t mt-1 pt-1.5"
                    >
                      ✕ {t("translateTo")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages && messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">{t("loadingMessages")}</p>
              )}
              {messages.map((msg) => {
                const isMe = msg.sender_id === currentUserId
                const hasTranslation = translations[msg.id] !== undefined
                const hasContextTranslation = contextTranslations[msg.id] !== undefined
                const isTranslating = translatingIds.has(msg.id)
                const showTranslation = msg.type === "text" && msg.text && (resolvedLang || hasContextTranslation || hasTranslation)
                return (
                  <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                    onContextMenu={(e) => {
                      if (msg.type === "text" && msg.text) {
                        e.preventDefault()
                        setContextMenu({ x: e.clientX, y: e.clientY, messageId: msg.id })
                      }
                    }}
                  >
                    <div className={cn("max-w-[70%] rounded-lg px-4 py-2 text-sm", isMe ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      {msg.type === "image" && msg.file_url ? (
                        <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                          <img src={msg.file_url} alt={msg.file_name ?? t("image")} className="max-w-full rounded max-h-60 object-contain" />
                        </a>
                      ) : msg.type === "pdf" && msg.file_url ? (
                        <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{msg.file_name ?? t("document")}</span>
                        </a>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                      <p className={cn("text-xs mt-1", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {formatMessageTime(msg.created_at)}
                      </p>
                    </div>
                    {/* Translation row */}
                    {showTranslation && (
                      <div className={cn("max-w-[70%] mt-1 rounded-md px-3 py-1.5 text-xs border border-dashed", isMe ? "bg-primary/5 text-foreground" : "bg-accent/50 text-foreground")}>
                        {isTranslating ? (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {t("translating")}
                          </span>
                        ) : hasTranslation ? (
                          <p>{translations[msg.id]}</p>
                        ) : hasContextTranslation ? (
                          <p>{contextTranslations[msg.id]}</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
              {/* Right-click context menu */}
              {contextMenu && (
                <div
                  className="fixed z-50 min-w-[160px] rounded-md border bg-popover p-1 shadow-md"
                  style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                  <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{t("translateTo")}</p>
                  {TRANSLATE_LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => handleContextMenuTranslate(contextMenu.messageId, lang.value)}
                    >
                      {t(lang.labelKey)}
                    </button>
                  ))}
                </div>
              )}
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
                title={t("attachFile")}
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
          <EmptyState icon={MessageSquare} title={t("selectConversation")} description={t("selectConversationDesc")} className="flex-1" />
        )}
      </div>

      {/* Media & Attachments Panel */}
      {selectedId && selectedOther && (
        <div className="hidden lg:flex w-64 border-l bg-card flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm">{t("mediaAndAttachments")}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {mediaMessages.length === 0 ? (
              <EmptyState icon={ImageIcon} title={t("noMedia")} description={t("noMediaDesc")} className="py-6" />
            ) : (
              <div className="space-y-3">
                {mediaMessages.map((msg) => (
                  <a
                    key={msg.id}
                    href={msg.file_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                  >
                    {msg.type === "image" ? (
                      <img src={msg.file_url!} alt={msg.file_name ?? t("image")} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-muted">
                        <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        <span className="text-xs truncate">{msg.file_name ?? t("document")}</span>
                      </div>
                    )}
                    <div className="px-2 py-1 text-xs text-muted-foreground">
                      {format(new Date(msg.created_at), "MMM d, yyyy")}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
