"use client"

import { useActionState, useState } from "react"
import { setStaffRole, setSuspension, type AdminState } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"

export function SuspendForm({ hostId, suspended }: { hostId: string; suspended: boolean }) {
  const [state, action] = useActionState<AdminState, FormData>(setSuspension, { status: "idle" })
  const [open, setOpen] = useState(false)
  if (suspended) {
    return (
      <form action={action} className="arow__side">
        <input type="hidden" name="host_id" value={hostId} />
        <input type="hidden" name="suspend" value="0" />
        <SubmitButton size="xs" variant="ghost" arrow={false} pendingText="Restoring…">Restore host</SubmitButton>
        {state.message && <small role="status">{state.message}</small>}
      </form>
    )
  }
  if (!open) return <div className="arow__side"><button type="button" className="btn btn--ghost btn--xs btn--plain" onClick={() => setOpen(true)}>Suspend…</button></div>
  return (
    <form action={action} className="arow__side stack" style={{ gap: 8 }}>
      <input type="hidden" name="host_id" value={hostId} />
      <input type="hidden" name="suspend" value="1" />
      <label className="field"><span className="field__label">Reason (shown to the host)</span>
        <input name="reason" required minLength={3} maxLength={300} autoComplete="off" placeholder="Fake event reported by guests…" />
      </label>
      <div className="actions" style={{ gap: 6 }}>
        <SubmitButton size="xs" variant="danger" arrow={false} pendingText="Suspending…">Suspend host</SubmitButton>
        <button type="button" className="btn btn--ghost btn--xs btn--plain" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {state.status === "error" && <small role="alert">{state.message}</small>}
    </form>
  )
}

export function StaffRoleForm() {
  const [state, action] = useActionState<AdminState, FormData>(setStaffRole, { status: "idle" })
  return (
    <form action={action} className="stack" noValidate>
      <label className="field"><span className="field__label">Email of their Ganor account</span>
        <input name="email" type="email" required autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="name@ganor.ng…" />
      </label>
      <div className="actions" style={{ gap: 8 }}>
        <button className="btn btn--primary btn--sm btn--plain" name="grant" value="1">Add as staff</button>
        <button className="btn btn--ghost btn--sm btn--plain" name="grant" value="0">Remove from staff</button>
      </div>
      {state.message && <p className="small" role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
    </form>
  )
}
