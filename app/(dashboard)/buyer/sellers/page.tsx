"use client"

import { useState } from "react"
import { Store, Search, MessageSquare, Package } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"

const demoSellers = [
  { id: "1", name: "Zhang Wei", company: "Kunming Aluminum Co.", city: "Kunming, China", products: 24, categories: ["Aluminum Profiles", "Hardware & Accessories"] },
  { id: "2", name: "Ahmed Hassan", company: "Gulf Aluminum Industries", city: "Dubai, UAE", products: 18, categories: ["Aluminum Sheets", "Glass Products"] },
  { id: "3", name: "Li Jing", company: "Shanghai Metal Works", city: "Shanghai, China", products: 32, categories: ["Steel Products", "Raw Materials"] },
]

export default function BuyerSellersPage() {
  const [search, setSearch] = useState("")

  const filtered = demoSellers.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.company.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sellers..." className="pl-9" />
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
                <div className="mt-4 flex flex-wrap gap-1">
                  {seller.categories.map((cat) => (
                    <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground"><Package className="h-3.5 w-3.5 inline mr-1" />{seller.products} products</span>
                  <Button size="sm" variant="outline"><MessageSquare className="h-3.5 w-3.5 mr-1" /> Chat</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Store} title="No sellers found" />
      )}
    </div>
  )
}
