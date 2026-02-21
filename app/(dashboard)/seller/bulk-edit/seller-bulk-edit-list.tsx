"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Save, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { updateProduct, deleteProduct } from "@/lib/actions/products"

interface ProductRow {
  id: string
  name: string
  model_number: string
  price_per_meter: number
  stock: number
}

export function SellerBulkEditList({ initialProducts }: { initialProducts: ProductRow[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [saving, setSaving] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const updateField = (id: string, field: string, value: string) => {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, [field]: field === "price_per_meter" || field === "stock" ? Number(value) : value } : p))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const product of products) {
        await updateProduct(product.id, {
          name: product.name,
          model_number: product.model_number,
          price_per_meter: product.price_per_meter,
          stock: product.stock,
        })
      }
      router.refresh()
    } catch {
      // Error handled silently
    }
    setSaving(false)
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      router.refresh()
    })
  }

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
                <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(product.id)} disabled={isPending}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
