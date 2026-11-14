"use client"

import { useState } from "react"
import { Icon } from "@/components/Icon"
import { SocialIcon } from "@/components/SocialIcon"

// Buttons for getting a private ticket link somewhere safe: a WhatsApp chat (the guest's own number,
// or a guest's number when the host resends), copy, and open.
export function TicketLinkActions({ link, phone, message, whatsappLabel = "Save to my WhatsApp", showOpen = true }: { link: string; phone?: string; message: string; whatsappLabel?: string; showOpen?: boolean }) {
  const [copied, setCopied] = useState(false)
  const wa = `https://wa.me/${(phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* clipboard blocked */ }
  }
  return (
    <div className="tlinks">
      <a className="btn btn--sm tlinks__wa" href={wa} target="_blank" rel="noopener noreferrer"><SocialIcon name="whatsapp" size={18} />{whatsappLabel}</a>
      <button type="button" className="btn btn--outline btn--sm" onClick={copy} aria-live="polite"><Icon name={copied ? "check-circle" : "doc"} size={18} />{copied ? "Copied" : "Copy link"}</button>
      {showOpen && <a className="btn btn--ghost btn--sm btn--plain" href={link} target="_blank" rel="noopener noreferrer"><Icon name="ticket" size={18} />Open ticket</a>}
    </div>
  )
}
