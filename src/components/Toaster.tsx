"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Icon } from "./Icon"

type Toast = { id: number; k: "ok" | "error"; m: string; out?: boolean }

const COOKIE = "ganor_flash"

type Flash = { k: "ok" | "error"; m: string; t: number }

function readFlash(): Flash[] {
  const hit = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`))
  if (!hit) return []
  document.cookie = `${COOKIE}=; Max-Age=0; path=/`
  let raw = hit[1]
  for (let i = 0; i < 3; i++) {
    try { const v = JSON.parse(raw); return Array.isArray(v) ? v : [v] } catch { try { raw = decodeURIComponent(raw) } catch { return [] } }
  }
  return []
}

// Pop-up banner for the result of any dashboard action. Server actions leave a one-shot cookie
// (lib/flash.ts); this picks it up after the action finishes, shows it, then clears it.
// Hover or focus pauses the countdown. Client code can also call window.dispatchEvent(new CustomEvent("ganor:toast", { detail: { k, m } })).
export function Toaster() {
  const [items, setItems] = useState<Toast[]>([])
  const seen = useRef(new Set<number>())

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.map((t) => (t.id === id ? { ...t, out: true } : t)))
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 180)
  }, [])

  const push = useCallback((k: "ok" | "error", m: string, t = Date.now()) => {
    if (!m || seen.current.has(t)) return
    seen.current.add(t)
    const id = t + Math.random()
    setItems((list) => [...list.slice(-2), { id, k, m }])
  }, [])

  useEffect(() => {
    const check = () => { for (const f of readFlash()) push(f.k === "error" ? "error" : "ok", f.m, f.t) }
    const onEvent = (e: Event) => { const d = (e as CustomEvent<{ k: "ok" | "error"; m: string }>).detail; if (d) push(d.k, d.m) }
    check()
    const iv = setInterval(check, 400)
    window.addEventListener("focus", check)
    window.addEventListener("ganor:toast", onEvent)
    return () => { clearInterval(iv); window.removeEventListener("focus", check); window.removeEventListener("ganor:toast", onEvent) }
  }, [push])

  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {items.map((t) => (
        <div key={t.id} className={`toast toast--${t.k}${t.out ? " is-out" : ""}`} role={t.k === "error" ? "alert" : "status"}>
          <span className="toast__ic" aria-hidden="true"><Icon name={t.k === "error" ? "warning" : "check-circle"} size={20} /></span>
          <span className="toast__m"><b>{t.k === "error" ? "Didn't work" : "Done"}</b>{t.m}</span>
          <button type="button" className="toast__x" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
          {/* The bar runs down the time left; when it ends the banner closes. Hovering pauses it. */}
          <span className="toast__bar" aria-hidden="true" style={{ animationDuration: `${t.k === "error" ? 7000 : 4500}ms` }} onAnimationEnd={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  )
}
