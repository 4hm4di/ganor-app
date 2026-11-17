"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const APP = /^\/(dashboard|hq|gate)(\/|$)/

// Same entrance motion as ganor.ng (assets/js/site.js): the hero rises in on load,
// headline lines slide up, and [data-reveal] blocks fade up as they scroll into view.
// The working areas (dashboard, HQ, gate) skip it so content shows at once (html.app-fast,
// set before first paint in layout.tsx). Only newly added elements are looked at, so long
// pages and live updates stay cheap.
export function Motion() {
  const path = usePathname()
  const app = APP.test(path)

  useEffect(() => {
    document.documentElement.classList.toggle("app-fast", app)
  }, [app])

  useEffect(() => {
    const seen = new WeakSet<Element>()
    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver((entries) => {
            for (const e of entries) {
              if (!e.isIntersecting) continue
              e.target.classList.add("is-in")
              io?.unobserve(e.target)
            }
          }, { rootMargin: "0px 0px 15% 0px", threshold: 0 })
        : null

    // Prepare everything under `root` that hasn't been seen yet.
    function scan(root: ParentNode) {
      const all = <T extends Element>(sel: string) => {
        const list = Array.from(root.querySelectorAll<HTMLElement>(sel)) as unknown as T[]
        if (root instanceof Element && root.matches(sel)) list.unshift(root as unknown as T)
        return list as unknown as HTMLElement[]
      }
      for (const el of all("[data-lines]")) {
        if (seen.has(el)) continue
        el.querySelectorAll<HTMLElement>(".line > span").forEach((s, i) => s.style.setProperty("--i", String(i)))
      }
      for (const hero of all("[data-hero]")) {
        if (seen.has(hero)) continue
        seen.add(hero)
        hero.querySelectorAll<HTMLElement>("[data-rise]").forEach((el, i) => el.style.setProperty("--d", String(i)))
        requestAnimationFrame(() => {
          hero.classList.add("is-ready")
          hero.querySelectorAll("[data-lines]").forEach((t) => { seen.add(t); t.classList.add("is-in") })
        })
      }
      const reveal = all("[data-reveal]")
      const groups = new Map<Element | null, number>()
      for (const el of reveal) {
        if (seen.has(el)) continue
        const n = groups.get(el.parentElement) ?? 0
        groups.set(el.parentElement, n + 1)
        el.style.setProperty("--i", String(Math.min(n, 6)))
      }
      for (const el of [...reveal, ...all("[data-lines]").filter((e) => !e.closest("[data-hero]"))]) {
        if (seen.has(el)) continue
        seen.add(el)
        if (io && !document.documentElement.classList.contains("app-fast")) io.observe(el)
        else el.classList.add("is-in")
      }
    }

    scan(document)
    let queued = 0
    const pending = new Set<Element>()
    const mo = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach((n) => { if (n.nodeType === 1) pending.add(n as Element) })
      if (!pending.size || queued) return
      queued = requestAnimationFrame(() => {
        queued = 0
        const nodes = [...pending]
        pending.clear()
        for (const n of nodes) if (n.isConnected) scan(n)
      })
    })
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      mo.disconnect()
      io?.disconnect()
      if (queued) cancelAnimationFrame(queued)
    }
  }, [])
  return null
}
