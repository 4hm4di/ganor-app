"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// Re-fetches the overview every minute while the tab is visible. Shows when it last updated.
export function LiveRefresh({ every = 60 }: { every?: number }) {
  const router = useRouter()
  const [ago, setAgo] = useState(0)
  useEffect(() => {
    const tick = setInterval(() => {
      if (document.visibilityState !== "visible") return
      setAgo((a) => {
        if (a + 1 >= every) {
          router.refresh()
          return 0
        }
        return a + 1
      })
    }, 1000)
    const onVisible = () => { if (document.visibilityState === "visible") { router.refresh(); setAgo(0) } }
    document.addEventListener("visibilitychange", onVisible)
    return () => { clearInterval(tick); document.removeEventListener("visibilitychange", onVisible) }
  }, [every, router])
  return (
    <span className="livetag" title="Updates every minute">
      <i aria-hidden="true" />Live · {ago < 5 ? "just updated" : `updated ${ago}s ago`}
      <button type="button" className="linkbtn" onClick={() => { router.refresh(); setAgo(0) }}>Refresh</button>
    </span>
  )
}
