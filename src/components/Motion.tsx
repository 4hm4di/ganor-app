"use client"

import { useEffect } from "react"

// Same entrance motion as ganor.ng (assets/js/site.js): the hero rises in on load,
// headline lines slide up, and [data-reveal] blocks fade up as they scroll into view.
// Pages stream in after hydration (loading.tsx), so new elements are picked up as they arrive.
export function Motion() {
  useEffect(() => {
    const $$ = (sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<HTMLElement>(sel))
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

    function scan() {
      $$("[data-lines]").forEach((el) => {
        if (seen.has(el)) return
        $$(".line > span", el).forEach((s, i) => s.style.setProperty("--i", String(i)))
      })
      const groups = new Map<Element | null, number>()
      $$("[data-reveal]").forEach((el) => {
        const n = groups.get(el.parentElement) ?? 0
        groups.set(el.parentElement, n + 1)
        if (!seen.has(el)) el.style.setProperty("--i", String(Math.min(n, 6)))
      })
      $$("[data-hero]").forEach((hero) => {
        if (seen.has(hero)) return
        seen.add(hero)
        $$("[data-rise]", hero).forEach((el, i) => el.style.setProperty("--d", String(i)))
        requestAnimationFrame(() => {
          hero.classList.add("is-ready")
          $$("[data-lines]", hero).forEach((t) => { seen.add(t); t.classList.add("is-in") })
        })
      })
      const targets = [...$$("[data-reveal]"), ...$$("[data-lines]").filter((el) => !el.closest("[data-hero]"))]
      for (const el of targets) {
        if (seen.has(el)) continue
        seen.add(el)
        if (io) io.observe(el)
        else el.classList.add("is-in")
      }
    }

    scan()
    let queued = 0
    const mo = new MutationObserver(() => {
      if (queued) return
      queued = requestAnimationFrame(() => { queued = 0; scan() })
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
