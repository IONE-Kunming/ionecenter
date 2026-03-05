/* Stamp/Seal SVG component (notary-style) — shared between Create & View */
export function SealStamp() {
  /* Scalloped/gear outer ring – 24 teeth */
  const teeth = 24
  const cx = 60, cy = 60
  const outerR = 56, innerR = 50
  let scallopPath = ""
  for (let i = 0; i < teeth; i++) {
    const a1 = (Math.PI * 2 * i) / teeth
    const a2 = (Math.PI * 2 * (i + 0.5)) / teeth
    const x1 = cx + outerR * Math.cos(a1)
    const y1 = cy + outerR * Math.sin(a1)
    const x2 = cx + innerR * Math.cos(a2)
    const y2 = cy + innerR * Math.sin(a2)
    scallopPath += i === 0 ? `M${x1.toFixed(2)},${y1.toFixed(2)}` : `L${x1.toFixed(2)},${y1.toFixed(2)}`
    scallopPath += `L${x2.toFixed(2)},${y2.toFixed(2)}`
  }
  scallopPath += "Z"

  const color = "#2a7a8a"

  return (
    <svg viewBox="0 0 120 120" width="90" height="90" xmlns="http://www.w3.org/2000/svg">
      {/* Scalloped outer ring */}
      <path d={scallopPath} fill="none" stroke={color} strokeWidth="2" />
      {/* Two concentric circles */}
      <circle cx="60" cy="60" r="46" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="60" cy="60" r="40" fill="none" stroke={color} strokeWidth="1.2" />

      {/* Curved text paths */}
      <defs>
        <path id="stampTopArc" d="M20,60 A40,40 0 1,1 100,60" fill="none" />
        <path id="stampBottomArc" d="M96,68 A38,38 0 1,1 24,68" fill="none" />
      </defs>

      {/* "IONE CENTER" along the top */}
      <text fontSize="9" fontWeight="bold" fill={color} letterSpacing="3">
        <textPath href="#stampTopArc" startOffset="50%" textAnchor="middle">IONE CENTER</textPath>
      </text>

      {/* "CERTIFIED" along the bottom */}
      <text fontSize="8.5" fontWeight="bold" fill={color} letterSpacing="2.5">
        <textPath href="#stampBottomArc" startOffset="50%" textAnchor="middle">CERTIFIED</textPath>
      </text>

      {/* Horizontal lines with gap for "IONE" text in center */}
      <line x1="22" y1="60" x2="42" y2="60" stroke={color} strokeWidth="1.2" />
      <line x1="78" y1="60" x2="98" y2="60" stroke={color} strokeWidth="1.2" />
      <text x="60" y="64" textAnchor="middle" fontSize="14" fontWeight="900" fill={color} fontFamily="Arial, sans-serif">IONE</text>
    </svg>
  )
}
