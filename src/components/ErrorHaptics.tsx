"use client"

import { useEffect } from "react"
import { hapticError } from "@/lib/haptics"

// Buzzes when an error appears anywhere: inline error alerts (forms, sign-in pages, gate) and the
// browser's own "fill in this field" warnings. Error banners and failed scans call hapticError() directly.
const ERROR_SELECTOR = ".alert--error, [data-haptic='error']"

export function ErrorHaptics() {
  useEffect(() => {
    const seen = new WeakSet<Element>()
    const check = (node: Node) => {
      if (!(node instanceof Element)) return
      const hits = node.matches(ERROR_SELECTOR) ? [node] : [...node.querySelectorAll(ERROR_SELECTOR)]
      if (hits.some((el) => !seen.has(el))) { hits.forEach((el) => seen.add(el)); hapticError() }
    }
    const mo = new MutationObserver((list) => { for (const m of list) m.addedNodes.forEach(check) })
    mo.observe(document.body, { childList: true, subtree: true })
    document.querySelectorAll(ERROR_SELECTOR).forEach((el) => seen.add(el)) // already on screen at load: no buzz without a tap
    const onInvalid = () => hapticError()
    document.addEventListener("invalid", onInvalid, true)
    return () => { mo.disconnect(); document.removeEventListener("invalid", onInvalid, true) }
  }, [])
  return null
}
