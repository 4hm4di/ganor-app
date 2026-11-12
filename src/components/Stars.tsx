// Read-only star rating. A marigold row is clipped over a muted row, so 4.6 shows four and a bit stars.
const STAR = "M12 2.5l2.94 6.07 6.56.9-4.8 4.6 1.18 6.53L12 17.5l-5.88 3.1 1.18-6.53-4.8-4.6 6.56-.9z"

function Row({ size }: { size: number }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={STAR} /></svg>
      ))}
    </>
  )
}

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(5, value)) * 20
  return (
    <span className="stars" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      <span className="stars__base"><Row size={size} /></span>
      <span className="stars__fill" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}><Row size={size} /></span>
    </span>
  )
}

export const STAR_PATH = STAR
