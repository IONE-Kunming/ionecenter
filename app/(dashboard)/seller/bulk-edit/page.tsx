"use client"

import { useState } from "react"
import { Save, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const initialProducts = [
  { id: "1", name: "Premium Window Profile", model_number: "WP-6063-T5", price_per_meter: 12.50, stock: 500 },
  { id: "2", name: "Curtain Wall Section", model_number: "CW-100-A", price_per_meter: 28.00, stock: 350 },
  { id: "3", name: "Industrial T-Slot Profile", model_number: "TS-4040-V2", price_per_meter: 8.75, stock: 1200 },
  { id: "4", name: "Door Handle Set Chrome", model_number: "DH-CHR-01", price_per_meter: 35.00, stock: 450 },
]

export default function SellerBulkEditPage() {
  const [products, setProducts] = useState(initialProducts)
  const [saving, setSaving] = useState(false)

  const updateField = (id: string, field: string, value: string) => {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, [field]: field === "price_per_meter" || field === "stock" ? Number(value) : value } : p))
  }

  const handleSave = async () => { setSaving(true); await new Promise((r) => setTimeout(r, 1000)); setSaving(false) }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2"><Save className="h-4 w-4" /> {saving ? "Saving..." : "Save All Changes"}</Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Model #</TableHead>
              <TableHead>Price/m ($)</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell><Input value={product.name} onChange={(e) => updateField(product.id, "name", e.target.value)} className="h-8" /></TableCell>
                <TableCell><Input value={product.model_number} onChange={(e) => updateField(product.id, "model_number", e.target.value)} className="h-8 w-32" /></TableCell>
                <TableCell><Input type="number" step="0.01" value={product.price_per_meter} onChange={(e) => updateField(product.id, "price_per_meter", e.target.value)} className="h-8 w-24" /></TableCell>
                <TableCell><Input type="number" value={product.stock} onChange={(e) => updateField(product.id, "stock", e.target.value)} className="h-8 w-24" /></TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
