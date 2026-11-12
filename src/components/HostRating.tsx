import { Stars } from "./Stars"
import { MIN_COUNTED_RATINGS } from "@/lib/consent"
import type { ReviewSummary } from "@/lib/database.types"

// Average shows only once a host has enough counted ratings (guests scanned at the gate, orders not refunded).
export function HostRating({ summary, showSpread = false }: { summary: ReviewSummary | null; showSpread?: boolean }) {
  const counted = summary?.counted ?? 0
  if (!summary || counted < MIN_COUNTED_RATINGS) {
    return (
      <p className="rating">
        <Stars value={0} />
        <small>{counted > 0 ? `${counted} verified ${counted === 1 ? "rating" : "ratings"} so far` : "No verified ratings yet"}</small>
      </p>
    )
  }
  const rows = [5, 4, 3, 2, 1].map((n) => ({ n, c: summary[`r${n}` as "r5"] }))
  return (
    <div className="stack" style={{ gap: 8 }}>
      <p className="rating">
        <Stars value={summary.average} />
        {summary.average.toFixed(1)}
        <small>· {counted} verified {counted === 1 ? "rating" : "ratings"}</small>
      </p>
      {showSpread && (
        <div className="dist" aria-label="Rating spread">
          {rows.map(({ n, c }) => (
            <div key={n}><span>{n}</span><i><b style={{ transform: `scaleX(${c / counted})` }} /></i><span>{c}</span></div>
          ))}
        </div>
      )}
    </div>
  )
}
