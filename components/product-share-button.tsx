"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Share2, Link as LinkIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toaster"

interface ProductShareButtonProps {
  productName: string
  modelNumber: string
  price: number
  productId: string
  size?: "sm" | "md"
}

export function ProductShareButton({ productName, modelNumber, price, productId, size = "sm" }: ProductShareButtonProps) {
  const [showPopup, setShowPopup] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)
  const { addToast } = useToast()
  const popupRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  const getProductLink = useCallback(() => `${window.location.origin}/product/${productId}`, [productId])

  // Close popup on outside click
  useEffect(() => {
    if (!showPopup) return
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowPopup(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showPopup])

  // Load QR code when modal opens
  useEffect(() => {
    if (!showQR || !qrRef.current) return
    const container = qrRef.current
    const productLink = getProductLink()

    const renderQR = () => {
      while (container.firstChild) container.removeChild(container.firstChild)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const QRCode = (window as any).QRCode
      if (QRCode) {
        new QRCode(container, { text: productLink, width: 200, height: 200 })
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).QRCode) {
      renderQR()
    } else {
      const existingScript = document.querySelector('script[data-qrcodejs]')
      if (existingScript) {
        existingScript.addEventListener("load", renderQR)
        return
      }
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
      script.crossOrigin = "anonymous"
      script.setAttribute("data-qrcodejs", "true")
      script.onload = renderQR
      document.head.appendChild(script)
    }
  }, [showQR, getProductLink])

  // Reset copied state
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowPopup((v) => !v)
  }

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const productLink = getProductLink()
    const message = `Check out this product: ${productName}\nModel: ${modelNumber}\nPrice: $${price}\n${productLink}`
    window.open("https://wa.me/?text=" + encodeURIComponent(message), "_blank")
    setShowPopup(false)
  }

  const handleWeChat = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowQR(true)
    setShowPopup(false)
  }

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(getProductLink())
      setCopied(true)
      addToast("success", "Link copied!")
    } catch {
      addToast("error", "Failed to copy link")
    }
    setShowPopup(false)
  }

  const btnSize = size === "sm" ? "h-7 w-7" : "h-8 w-8"
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
  const popupBtnSize = "h-8 w-8"

  return (
    <>
      <div className="relative" ref={popupRef}>
        <button
          type="button"
          onClick={handleShareClick}
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-all",
            btnSize
          )}
          aria-label="Share"
        >
          <Share2 className={cn(iconSize, "text-foreground")} />
        </button>

        {showPopup && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-popover border rounded-lg shadow-lg p-1.5 flex items-center gap-1.5 z-50 whitespace-nowrap">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className={cn("inline-flex items-center justify-center rounded-full bg-[#25D366] hover:bg-[#128C7E] transition-all", popupBtnSize)}
              aria-label="Share on WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </button>
            {/* WeChat */}
            <button
              type="button"
              onClick={handleWeChat}
              className={cn("inline-flex items-center justify-center rounded-full bg-[#07C160] hover:bg-[#06A854] transition-all", popupBtnSize)}
              aria-label="Share on WeChat"
            >
              <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05a6.127 6.127 0 01-.253-1.726c0-3.573 3.27-6.47 7.3-6.47.34 0 .672.033 1.002.07C16.795 4.612 13.147 2.188 8.691 2.188zm-2.87 4.795a1.06 1.06 0 11-.001-2.12 1.06 1.06 0 01.001 2.12zm5.575 0a1.06 1.06 0 110-2.12 1.06 1.06 0 010 2.12zm5.148 3.96c-3.514 0-6.363 2.468-6.363 5.51 0 3.044 2.849 5.51 6.363 5.51.66 0 1.296-.096 1.903-.26a.636.636 0 01.536.073l1.415.83a.238.238 0 00.124.04c.12 0 .218-.1.218-.221 0-.054-.023-.108-.036-.16l-.29-1.102a.444.444 0 01.158-.497c1.397-1.032 2.257-2.55 2.257-4.213 0-3.042-2.849-5.51-6.285-5.51zm-2.455 3.493a.834.834 0 110-1.668.834.834 0 010 1.668zm4.91 0a.834.834 0 110-1.668.834.834 0 010 1.668z" />
              </svg>
            </button>
            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className={cn("inline-flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-all", popupBtnSize)}
              aria-label="Copy Link"
            >
              <LinkIcon className="h-4 w-4 text-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* WeChat QR Code Modal */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{productName}</DialogTitle>
            <DialogClose onClick={() => setShowQR(false)} />
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <p className="text-sm text-muted-foreground mb-4">Scan QR code to share on WeChat</p>
            <div ref={qrRef} />
          </div>
          <div className="flex justify-center pb-2">
            <Button variant="outline" onClick={() => setShowQR(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
