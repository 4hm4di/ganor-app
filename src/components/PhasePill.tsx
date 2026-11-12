import { PHASE_LABEL, type EventPhase } from "@/lib/ganor"

export function PhasePill({ phase }: { phase: EventPhase }) {
  return (
    <span className={`pill pill--${phase}`}>
      {phase === "live" && <i className="pill__dot" aria-hidden="true" />}
      {PHASE_LABEL[phase]}
    </span>
  )
}
