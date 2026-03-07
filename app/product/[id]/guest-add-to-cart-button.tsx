"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Link from "@/components/ui/link"
import { ShoppingCart, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export function GuestAddToCartButton() {
  const t = useTranslations("catalog")
  const tNav = useTranslations("nav")
  const tCommon = useTranslations("common")
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="space-y-3">
        <Button className="w-full gap-2" size="lg" onClick={() => setOpen(true)}>
          <ShoppingCart className="h-4 w-4" />
          {t("addToCart")}
        </Button>
        <Button variant="outline" className="w-full gap-2" size="lg" onClick={() => setOpen(true)}>
          <MessageSquare className="h-4 w-4" />
          {t("signUpToChat")}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("signInRequired")}</DialogTitle>
            <DialogDescription>{t("signInRequiredDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Link href="/sign-in">
              <Button variant="outline" className="w-full sm:w-auto">
                {tNav("logIn")}
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="w-full sm:w-auto">
                {tNav("signUpFree")}
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
