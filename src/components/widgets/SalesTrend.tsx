"use client"

import { useState } from "react"

type Day = { day: string; label: string; count: number }

// The landing page's "Tickets sold" card, with real numbers: a running total line for the last 14 days
// that always ends on the true total, and a dashed projection to event day from the last 7 days' pace.
export function SalesTrend({ days, total, capacity, daysLeft, unit = "sold", endLabel = "event day", projDelta = false }: {
  days: Day[]; total: number; capacity: number; daysLeft: number; unit?: string
  endLabel?: string; projDelta?: boolean
}) {
  const [hover, setHover] = useState<number | null>(null)
  const inWindow = days.reduce((n, d) => n + d.count, 0)
  const base = Math.max(0, total - inWindow)
  const cum: number[] = []
  days.reduce((run, d) => { const v = run + d.count; cum.push(v); return v }, base)

  const recent = days.slice(-7).reduce((n, d) => n + d.count, 0) / 7
  const room = capacity > 0 ? Math.max(0, capacity - total) : Infinity // no capacity: no ceiling
  const projSteps = daysLeft > 0 && room > 0 ? Math.min(daysLeft, 7) : 0
  const projected = projSteps ? Math.min(capacity > 0 ? capacity : Infinity, Math.round(total + recent * daysLeft)) : total

  const W = 600, H = 180, PAD = 14
  const slots = days.length - 1 + projSteps
  const maxY = Math.max(1, capacity || 0, projected, ...cum)
  const x = (i: number) => (slots ? (i / slots) * W : 0)
  const y = (v: number) => H - PAD - (v / maxY) * (H - PAD * 2)
  const line = cum.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")
  const area = `${line} L${x(cum.length - 1).toFixed(1)} ${H} L0 ${H}Z`
  const last = cum.length - 1
  const proj = projSteps ? `M${x(last).toFixed(1)} ${y(total).toFixed(1)} L${x(slots).toFixed(1)} ${y(projected).toFixed(1)}` : ""
  const capY = capacity ? y(capacity) : null

  const h = hover ?? last
  const tipX = x(h) / W, tipY = y(cum[h] ?? total) / H
  const tip = hover === null
    ? projSteps ? (projDelta ? `About ${(projected - total).toLocaleString("en-NG")} more in the ${endLabel}` : `About ${projected.toLocaleString("en-NG")} by ${endLabel}`) : `${days[last]?.label} · ${days[last]?.count ?? 0} ${unit}`
    : `${days[h]?.label} · ${days[h]?.count ?? 0} ${unit} · ${cum[h]?.toLocaleString("en-NG")} total`

  return (
    <div className="strend">
      <div
        className="chart strend__chart"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const i = Math.round(((e.clientX - r.left) / r.width) * slots)
          setHover(Math.max(0, Math.min(last, i)))
        }}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <g className="chart__grid"><line x1="0" x2={W} y1={H * 0.25} y2={H * 0.25} /><line x1="0" x2={W} y1={H * 0.5} y2={H * 0.5} /><line x1="0" x2={W} y1={H * 0.75} y2={H * 0.75} /></g>
          {capY !== null && <line className="strend__cap" x1="0" x2={W} y1={capY} y2={capY} />}
          <path className="strend__area" d={area} />
          <path className="chart__line" pathLength={1} d={line} />
          {proj && <path className="strend__proj" d={proj} />}
        </svg>
        {/* HTML dots keep their round shape at any card width (the SVG itself stretches). */}
        {projSteps > 0 && <span className="strend__pdot" style={{ left: `${(x(slots) / W) * 100}%`, top: `${(y(projected) / H) * 100}%` }} aria-hidden="true" />}
        <span className="chart__dot" style={{ left: `${tipX * 100}%`, top: `${tipY * 100}%` }} aria-hidden="true" />
        <p className="chart__tip" style={{ left: `clamp(70px, ${tipX * 100}%, calc(100% - 70px))`, top: `${tipY * 100}%` }}>{tip}</p>
      </div>
      <p className="card__foot strend__foot">
        <span>{days[0]?.label}</span>
        <span>{days[last]?.label}{projSteps ? " · today" : ""}</span>
        {projSteps > 0 && <span className="strend__pl">{endLabel}</span>}
      </p>
      <p className="sr-only">{total} of {capacity} {unit}. {projSteps ? `Projected about ${projected} by ${endLabel}.` : ""}</p>
    </div>
  )
}
