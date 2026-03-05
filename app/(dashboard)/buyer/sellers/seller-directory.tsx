"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Store, Search, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/empty-state"
import { getOrCreateConversation } from "@/lib/actions/chat"

interface SellerRow {
  id: string
  name: string
  company: string
  city: string
}

export function SellerDirectory({ sellers }: { sellers: SellerRow[] }) {
  const [search, setSearch] = useState("")
  const [chatPending, startChat] = useTransition()
  const t = useTranslations("sellerDirectory")

  function handleMessage(sellerId: string) {
    startChat(async () => {
      const conversation = await getOrCreateConversation(sellerId)
      if (conversation) {
        window.location.href = `/buyer/chats?id=${conversation.id}`
      }
    })
  }

  const filtered = sellers.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.company.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchSellers")} className="pl-9" />
      </div>

      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((seller) => (
            <Card key={seller.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar alt={seller.name} fallback={seller.name.charAt(0)} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{seller.name}</h3>
                    <p className="text-sm text-muted-foreground">{seller.company}</p>
                    <p className="text-xs text-muted-foreground mt-1">{seller.city}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <Button size="sm" variant="outline" onClick={() => handleMessage(seller.id)} disabled={chatPending}><MessageSquare className="h-3.5 w-3.5 mr-1" /> {t("message")}</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Store} title={t("noSellers")} />
      )}
    </div>
  )
}
