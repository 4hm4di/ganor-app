"use client"

import { useState } from "react"
import { Icon } from "@/components/Icon"
import { SocialIcon } from "@/components/SocialIcon"
import { toast } from "@/lib/toast"

type Extra = { href: string; label: string; icon: string }

// Buttons for getting a private ticket link somewhere safe: a WhatsApp chat (the guest's own number,
// or a guest's number when the host resends), copy, open, plus any extras (calendar, directions).
// One even group: WhatsApp full width, the rest in equal columns that follow the space available.
export function TicketLinkActions({ link, phone, message, whatsappLabel = "Save to my WhatsApp", showOpen = true, extras = [] }: { link: string; phone?: string; message: string; whatsappLabel?: string; showOpen?: boolean; extras?: Extra[] }) {
  const [copied, setCopied] = useState(false)
  const wa = `https://wa.me/${(phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); toast("Ticket link copied. Keep it private."); setTimeout(() => setCopied(false), 1800) } catch { toast("Couldn't copy. Press and hold the link to copy it.", "error") }
  }
  const count = 2 + (showOpen ? 1 : 0) + extras.length
  return (
    <div className="tlinks-box">
      <div className="tlinks" data-n={count}>
        <a className="btn btn--sm tlinks__wa" href={wa} target="_blank" rel="noopener noreferrer"><SocialIcon name="whatsapp" size={18} /><span>{whatsappLabel}</span></a>
        <button type="button" className="btn btn--outline btn--sm" onClick={copy} aria-live="polite"><Icon name={copied ? "check-circle" : "doc"} size={18} /><span>{copied ? "Copied" : "Copy link"}</span></button>
        {showOpen && <a className="btn btn--outline btn--sm" href={link} target="_blank" rel="noopener noreferrer"><Icon name="ticket" size={18} /><span>Open ticket</span></a>}
        {extras.map((x) => (
          <a key={x.label} className="btn btn--outline btn--sm" href={x.href} target="_blank" rel="noopener noreferrer"><Icon name={x.icon} size={18} /><span>{x.label}</span></a>
        ))}
      </div>
    </div>
  )
}
