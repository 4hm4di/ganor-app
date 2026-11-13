"use client"

import { useEffect, useRef, useState } from "react"

// Rolling digits, as on the Ganor landing page: each digit is a 0–9 column that slides to its value
// when the number scrolls into view, and rolls again when a live refresh changes it.
export function CountUp({ value, format = (n) => n.toLocaleString("en-NG") }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setOn(true); io.disconnect() } }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const text = format(value)
  return (
    <span ref={ref} className="roll" aria-label={text}>
      {[...text].map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={`${text.length}-${i}`} className="roll__d" aria-hidden="true">
            <span className="roll__col" style={{ "--n": on ? Number(ch) : 0, "--i": i } as React.CSSProperties}>
              {"0123456789".split("").map((d) => <span key={d}>{d}</span>)}
            </span>
          </span>
        ) : <span key={`${text.length}-${i}`} className="roll__s" aria-hidden="true">{ch}</span>,
      )}
    </span>
  )
}
