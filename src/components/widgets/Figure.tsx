"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { CountUp } from "./CountUp"

const full = (n: number) => n.toLocaleString("en-NG")
const compact = new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 })
const short = (n: number) => (Math.abs(n) >= 10_000 ? compact.format(n) : full(n))

// A headline number that always fits its card. The font scales with the card's width (CSS container
// units, see .fig in globals.css); when even the smallest size can't hold the full number, it switches
// to the short form (₦958.8M). The full value stays in the title and the screen-reader label.
export function Figure({ value, naira = false }: { value: number; naira?: boolean }) {
  const prefix = naira ? "₦" : ""
  const wrap = useRef<HTMLSpanElement>(null)
  const probe = useRef<HTMLSpanElement>(null)
  const [isShort, setShort] = useState(false)

  useLayoutEffect(() => {
    const box = wrap.current?.parentElement
    const p = probe.current
    if (!box || !p) return
    const check = () => setShort(p.offsetWidth > box.clientWidth + 0.5)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(box)
    return () => ro.disconnect()
  }, [value, naira])

  const text = prefix + full(value)
  return (
    <span ref={wrap} className="fig" title={isShort ? text : undefined} style={{ "--len": (isShort ? prefix + short(value) : text).length } as React.CSSProperties}>
      <span ref={probe} className="fig__probe" aria-hidden="true" style={{ "--len": text.length } as React.CSSProperties}>{text}</span>
      <CountUp value={value} prefix={prefix} format={isShort ? short : full} label={text} />
    </span>
  )
}
