"use client"

import { useState } from "react"

type Point = { label: string; value: number; sub?: string }

// One-series bar chart: thin rounded bars on a recessive grid, a hover/tap tooltip per bar,
// bars grow in when the card reveals. Days run left to right, oldest first.
export function BarChart({ points, unit, color = "var(--chart-bar)" }: { points: Point[]; unit: string; color?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...points.map((p) => p.value))
  const ticks = [max, Math.round(max / 2), 0]
  const h = hover === null ? null : points[hover]
  return (
    // Gaps shrink as the number of days grows, so 90 bars still fit a phone-width card.
    <div className="bars" onMouseLeave={() => setHover(null)} style={{ "--gap": points.length > 60 ? "1px" : points.length > 20 ? "2px" : "4px" } as React.CSSProperties}>
      <div className="bars__grid" aria-hidden="true">
        {ticks.map((t, i) => <span key={i} style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}><em>{t}</em></span>)}
      </div>
      <div className="bars__plot" role="img" aria-label={`${unit} per day: ${points.map((p) => `${p.label} ${p.value}`).join(", ")}`}>
        {points.map((p, i) => (
          <button
            key={i}
            type="button"
            className={`bars__col${hover === i ? " is-on" : ""}`}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onClick={() => setHover(i)}
            aria-label={`${p.label}: ${p.value} ${unit}`}
          >
            <i style={{ "--h": p.value / max, "--d": `${Math.round((i * 600) / Math.max(points.length, 20))}ms`, background: color } as React.CSSProperties} />
          </button>
        ))}
        {h && hover !== null && (
          <div className="bars__tip" style={{ left: `clamp(48px, ${((hover + 0.5) / points.length) * 100}%, calc(100% - 48px))` }} role="status">
            <b>{h.value.toLocaleString("en-NG")}</b> {unit}<small>{h.sub ?? h.label}</small>
          </div>
        )}
      </div>
      <div className="bars__x" aria-hidden="true">
        {points.map((p, i) => {
          const last = points.length - 1
          const step = points.length > 45 ? 14 : 7
          const show = i === 0 || (i % step === 0 && last - i >= step / 2) || i === last
          return <span key={i}>{show ? p.label : ""}</span>
        })}
      </div>
    </div>
  )
}
