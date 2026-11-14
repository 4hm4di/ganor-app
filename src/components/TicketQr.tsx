"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"

export function TicketQr({ text, size = 200 }: { text: string; size?: number }) {
  const [svg, setSvg] = useState("")
  useEffect(() => { QRCode.toString(text, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#15132A", light: "#FFFFFF" } }).then(setSvg) }, [text])
  return <div className="rsvpok__qr" style={{ width: size, height: size }} aria-label={`QR code for ticket ${text}`} role="img" dangerouslySetInnerHTML={{ __html: svg }} />
}
