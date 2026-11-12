import { LOADER_PATH, SYMBOL_PATH } from "./brandPaths"

// The Ganor loader: the symbol swings round and settles, the same motion as the landing page gate.
// CSS drives the motion (not SMIL) so it can calm down under prefers-reduced-motion.
// The viewBox is padded so the corners never clip while the symbol rotates (a 120 square needs 170 to turn).
export function Loader({ size = 24, label, className = "" }: { size?: number; label?: string; className?: string }) {
  return (
    <svg
      className={`loader ${className}`}
      width={size}
      height={size}
      viewBox="-26 -26 172 172"
      overflow="visible"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path className="loader__mark" fill="currentColor" fillRule="evenodd" d={LOADER_PATH} />
    </svg>
  )
}

export function GanorSymbol({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <path fill="currentColor" fillRule="evenodd" d={SYMBOL_PATH} />
    </svg>
  )
}

// Full-area loader for route transitions (loading.tsx).
export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="pageloader" role="status" aria-live="polite">
      <Loader size={72} />
      <span>{label}…</span>
    </div>
  )
}
