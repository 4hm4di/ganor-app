"use client"

import { useEffect } from "react"

// Plays the landing page entrance (chart line draws, meters fill) as each card scrolls into view.
export function Reveal() {
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".bento .card")
    if (!("IntersectionObserver" in window)) {
      cards.forEach((c) => c.classList.add("is-in"))
      return
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in")
          io.unobserve(e.target)
        }
      }
    }, { threshold: 0.25 })
    cards.forEach((c) => io.observe(c))
    return () => io.disconnect()
  }, [])
  return null
}
