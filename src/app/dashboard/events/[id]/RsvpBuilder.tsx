"use client"

import { useActionState, useState } from "react"
import { saveRsvpFields, type FormState } from "../../actions"
import { RSVP_MAX, RSVP_PRESETS, type RsvpField } from "@/lib/rsvp"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"

// Pick up to six short questions. Name and phone are always asked, so the guest list and the gate work.
export function RsvpBuilder({ eventId, initial, max = RSVP_MAX }: { eventId: string; initial: RsvpField[]; max?: number }) {
  const [state, action] = useActionState<FormState, FormData>(saveRsvpFields, { status: "idle" })
  const [fields, setFields] = useState<RsvpField[]>(initial)
  const [custom, setCustom] = useState("")
  const [customChoices, setCustomChoices] = useState("")
  const has = (k: string) => fields.some((f) => f.key === k)
  const full = fields.length >= max

  const toggle = (p: (typeof RSVP_PRESETS)[number]) =>
    setFields((fs) => (fs.some((f) => f.key === p.key) ? fs.filter((f) => f.key !== p.key) : fs.length >= max ? fs : [...fs, { ...p, required: false }]))
  const addCustom = () => {
    const label = custom.trim()
    if (label.length < 2 || full) return
    const options = customChoices.split(",").map((s) => s.trim()).filter(Boolean)
    const key = `q${Date.now().toString(36).slice(-5)}`
    setFields((fs) => [...fs, { key, label, type: options.length >= 2 ? "select" : "text", required: false, ...(options.length >= 2 ? { options } : {}) }])
    setCustom(""); setCustomChoices("")
  }

  return (
    <form action={action} className="stack rsvpb" noValidate>
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="fields" value={JSON.stringify(fields)} />
      <p className="small muted">Every guest gives their <b>name</b> and <b>phone number</b>. Add up to {max} more questions{max < RSVP_MAX ? " on the Free plan" : ""}. Fewer questions means more people finish.</p>

      <div className="rsvpb__chips" role="group" aria-label="Common questions">
        {RSVP_PRESETS.map((p) => (
          <button key={p.key} type="button" className={`chipbtn${has(p.key) ? " is-on" : ""}`} aria-pressed={has(p.key)} disabled={!has(p.key) && full} onClick={() => toggle(p)}>
            {has(p.key) ? "✓ " : "+ "}{p.label}
          </button>
        ))}
      </div>

      {fields.length > 0 && (
        <ol className="rsvpb__list">
          {fields.map((f, i) => (
            <li key={f.key}>
              <span className="rsvpb__q"><b>{f.label}</b><small>{f.type === "select" ? f.options?.join(" · ") : f.type === "email" ? "Email address" : "Short answer"}</small></span>
              <label className="rsvpb__req"><input type="checkbox" checked={f.required} onChange={(e) => setFields((fs) => fs.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)))} />Required</label>
              <button type="button" className="iconbtn" aria-label={`Remove ${f.label}`} onClick={() => setFields((fs) => fs.filter((_, j) => j !== i))}><Icon name="close-circle" size={20} /></button>
            </li>
          ))}
        </ol>
      )}

      {!full && (
        <div className="rsvpb__custom">
          <label className="field"><span className="field__label">Your own question <small>(optional)</small></span>
            <input value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={80} placeholder="Which session will you attend?" autoComplete="off" />
          </label>
          <label className="field"><span className="field__label">Choices <small>(optional, comma separated)</small></span>
            <input value={customChoices} onChange={(e) => setCustomChoices(e.target.value)} maxLength={200} placeholder="Morning, Afternoon" autoComplete="off" />
          </label>
          <div><button type="button" className="btn btn--ghost btn--sm btn--plain" onClick={addCustom} disabled={custom.trim().length < 2}>Add question</button></div>
        </div>
      )}

      {state.status === "error" && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>}
      {state.status === "ok" && <div className="alert alert--ok" role="status"><Icon name="check-circle" /><span>{state.message}</span></div>}
      <div><SubmitButton pendingText="Saving…">Save RSVP form</SubmitButton></div>
    </form>
  )
}
