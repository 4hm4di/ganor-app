"use client"

import { useState, useSyncExternalStore } from "react"
import { Icon } from "./Icon"
import { SocialIcon } from "./SocialIcon"

const noop = () => () => {}

export function ShareButtons({ url, title, text, compact = false }: { url: string; title: string; text: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const canShare = useSyncExternalStore(noop, () => "share" in navigator, () => false)

  const u = encodeURIComponent(url)
  const msg = encodeURIComponent(`${text} ${url}`)
  const links = [
    { name: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${msg}` },
    { name: "x", label: "X", href: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${u}` },
    { name: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  ]

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt("Copy this link", url)
    }
  }

  return (
    <div className={`share${compact ? " share--compact" : ""}`}>
      <div className="share__link">
        <span className="share__url" title={url}>{url.replace(/^https?:\/\//, "")}</span>
        <button type="button" className="btn btn--primary btn--xs" onClick={copy} aria-live="polite">
          <Icon name={copied ? "check-circle" : "share"} size={16} />{copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <div className="share__row">
        {links.map((l) => (
          <a key={l.name} className="share__btn" href={l.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${l.label}`}>
            <SocialIcon name={l.name} size={18} /><span>{l.label}</span>
          </a>
        ))}
        {canShare && (
          <button type="button" className="share__btn" onClick={() => navigator.share({ title, text, url }).catch(() => {})}>
            <Icon name="send" size={18} /><span>More</span>
          </button>
        )}
      </div>
    </div>
  )
}
