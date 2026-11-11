import { LOADER_PATH, SYMBOL_PATH } from "./brandPaths"

// The Ganor loader: the symbol swings round and settles, the same motion as the landing page gate.
export function Loader({ size = 24, label, className = "" }: { size?: number; label?: string; className?: string }) {
  return (
    <svg
      className={`loader ${className}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path fill="currentColor" fillRule="evenodd" d={LOADER_PATH}>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 60 60;372 60 60;354 60 60;364 60 60;359 60 60;360 60 60;360 60 60"
          keyTimes="0;0.42;0.56;0.66;0.74;0.8;1"
          calcMode="spline"
          keySplines="0.6 0 0.3 1;0.6 0 0.3 1;0.6 0 0.3 1;0.6 0 0.3 1;0.6 0 0.3 1;0 0 1 1"
          dur="1.6s"
          repeatCount="indefinite"
        />
      </path>
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
      <Loader size={48} />
      <span>{label}…</span>
    </div>
  )
}
