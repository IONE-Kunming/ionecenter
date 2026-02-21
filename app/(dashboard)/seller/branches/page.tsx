"use client"

import { useState } from "react"
import { Building2, Plus, Pencil, Trash2, MapPin, Phone, Mail } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"

const initialBranches = [
  { id: "1", name: "Kunming Main Factory", address: "88 Dianchi Road", city: "Kunming", state: "Yunnan", country: "China", phone: "+86-871-1234567", email: "factory@kunmingalum.cn" },
  { id: "2", name: "Shanghai Office", address: "100 Nanjing West Road", city: "Shanghai", state: "Shanghai", country: "China", phone: "+86-21-7654321", email: "shanghai@kunmingalum.cn" },
]

export default function SellerBranchesPage() {
  const [branches, setBranches] = useState(initialBranches)
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><Button onClick={() => setShowAddModal(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Branch</Button></div>

      {branches.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <Card key={branch.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{branch.name}</h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </div>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {branch.address}, {branch.city}, {branch.state}, {branch.country}</p>
                  {branch.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {branch.phone}</p>}
                  {branch.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {branch.email}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (<EmptyState icon={Building2} title="No branches" action={{ label: "Add Branch", onClick: () => setShowAddModal(true) }} />)}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Branch</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Branch Name</Label><Input placeholder="e.g., Main Factory" /></div>
            <div className="space-y-2"><Label>Address</Label><Input placeholder="Street address" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>City</Label><Input placeholder="City" /></div>
              <div className="space-y-2"><Label>State</Label><Input placeholder="State/Province" /></div>
            </div>
            <div className="space-y-2"><Label>Country</Label><Input placeholder="Country" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input placeholder="+1-234-567-8901" /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="branch@example.com" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={() => setShowAddModal(false)}>Add Branch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
