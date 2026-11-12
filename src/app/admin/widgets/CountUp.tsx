"use client"

import { useEffect, useRef, useState } from "react"

// Counts from 0 to the value when it scrolls into view, and eases to new values on live refresh.
export function CountUp({ value, format = (n) => n.toLocaleString("en-NG") }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const from = useRef(0)
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    const run = () => {
      const start = performance.now()
      const a = from.current
      const dur = reduce ? 0 : 900
      const step = (t: number) => {
        const p = dur ? Math.min(1, (t - start) / dur) : 1
        const eased = 1 - Math.pow(1 - p, 3)
        setShown(Math.round(a + (value - a) * eased))
        if (p < 1) raf = requestAnimationFrame(step)
        else from.current = value
      }
      raf = requestAnimationFrame(step)
    }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { run(); io.disconnect() } }, { threshold: 0.3 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [value])
  return <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>{format(shown)}</span>
}
