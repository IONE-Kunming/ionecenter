"use client"

import { useEffect, useRef } from "react"
import JsBarcode from "jsbarcode"

export function BarcodeCanvas({ value, height = 50, width = 1.5 }: { value: string; height?: number; width?: number }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (svgRef.current && value && value.length > 0) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          height,
          width,
          displayValue: true,
          fontSize: 10,
          margin: 0,
          background: "transparent",
        })
      } catch {
        // Silently handle invalid barcode values
      }
    }
  }, [value, height, width])

  return <svg ref={svgRef} />
}
