"use client"

import { useEffect } from "react"
import { IDLE_MINUTES } from "@/lib/session"

// While a host is active on a page, ping the server every few minutes so the session stays
// alive. After IDLE_MINUTES with no taps, keys or scrolling, sign out and go to the sign-in page.
export function IdleGuard({ area = "host" }: { area?: "host" | "hq" }) {
  useEffect(() => {
    let lastActive = Date.now()
    let lastPing = Date.now()
    const mark = () => { lastActive = Date.now() }
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }))

    const signOut = () => {
      const f = document.createElement("form")
      f.method = "post"
      f.action = `/auth/signout?why=idle${area === "hq" ? "&to=hq" : ""}`
      document.body.appendChild(f)
      f.submit()
    }
    const timer = window.setInterval(async () => {
      const now = Date.now()
      if (now - lastActive > IDLE_MINUTES * 60_000) return signOut()
      if (lastActive > lastPing && now - lastPing > 4 * 60_000) {
        lastPing = now
        const r = await fetch(`/auth/keepalive${area === "hq" ? "?to=hq" : ""}`, { cache: "no-store" }).catch(() => null)
        if (r?.status === 401) signOut()
      }
    }, 30_000)

    // Coming back to the tab after a long time away: check straight away.
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastActive > IDLE_MINUTES * 60_000) signOut()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(timer)
      events.forEach((e) => window.removeEventListener(e, mark))
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [area])
  return null
}
