"use client"

import { useState } from "react"
import { Icon } from "@/components/Icon"

export type SaleRow = { id: string; buyer: string; line: string; amount: string; sub: string; refunded: boolean }

// Recent sales: the latest 10, then 10 more per tap.
export function SalesList({ rows, step = 10 }: { rows: SaleRow[]; step?: number }) {
  const [shown, setShown] = useState(step)
  const left = rows.length - shown
  return (
    <>
      <ul className="card wtx">
        {rows.slice(0, shown).map((o) => (
          <li key={o.id} className={o.refunded ? "is-refunded" : ""}>
            <span className={`wtx__ic${o.refunded ? " wtx__ic--bad" : ""}`} aria-hidden="true"><Icon name={o.refunded ? "receipt" : "ticket"} size={18} /></span>
            <span className="wtx__main"><b>{o.buyer}</b><small>{o.line}</small></span>
            <span className="wtx__amt"><b>{o.amount}</b><small>{o.sub}</small></span>
          </li>
        ))}
      </ul>
      {left > 0 && (
        <button type="button" className="btn btn--ghost btn--sm btn--plain wtx__more" onClick={() => setShown((n) => n + step)}>
          <Icon name="arrow-down" size={16} />Show {Math.min(step, left)} more <small>({left} left)</small>
        </button>
      )}
    </>
  )
}
