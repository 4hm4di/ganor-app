"use client"

import { useActionState, useEffect, useState } from "react"
import QRCode from "qrcode"
import { submitRsvp, type RsvpState } from "./rsvp"
import type { RsvpField } from "@/lib/rsvp"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"

function Qr({ text }: { text: string }) {
  const [svg, setSvg] = useState("")
  useEffect(() => { QRCode.toString(text, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#15132A", light: "#FFFFFF" } }).then(setSvg) }, [text])
  return <div className="rsvpok__qr" aria-label={`QR code for ticket ${text}`} role="img" dangerouslySetInnerHTML={{ __html: svg }} />
}

export function RsvpForm({ eventId, eventTitle, options, fields }: { eventId: string; eventTitle: string; options: { id: string; name: string; left: number }[]; fields: RsvpField[] }) {
  const [state, action] = useActionState<RsvpState, FormData>(submitRsvp, { status: "idle" })
  const open = options.filter((o) => o.left > 0)

  if (state.status === "ok") {
    return (
      <div className="rsvpok" role="status">
        <Icon name="check-circle" size={36} />
        <b style={{ font: "800 22px/28px var(--ganor-font-display)" }}>You&rsquo;re on the list, {state.name.split(/\s+/)[0]}</b>
        <span className="small muted">{state.ticket} · {eventTitle}</span>
        <Qr text={state.code} />
        <span className="rsvpok__code">{state.code}</span>
        <span className="small muted">Screenshot this. Show the QR code or read out the code at the gate.</span>
      </div>
    )
  }
  if (!open.length) return <p className="muted">RSVPs are full.</p>
  const v = state.status === "error" ? state.values ?? {} : {}

  return (
    <form action={action} className="rsvpf" key={state.status === "error" ? JSON.stringify(v) : "f"} noValidate>
      <input type="hidden" name="event_id" value={eventId} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
      {state.status === "error" && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>}
      {open.length > 1 ? (
        <label className="field"><span className="field__label">Which one?</span>
          <select name="ticket_type" required defaultValue={v.ticket_type ?? open[0].id}>
            {open.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.left} left)</option>)}
          </select>
        </label>
      ) : <input type="hidden" name="ticket_type" value={open[0].id} />}
      <label className="field"><span className="field__label">Full name</span>
        <input name="name" required minLength={2} maxLength={80} autoComplete="name" defaultValue={v.name ?? ""} />
      </label>
      <label className="field"><span className="field__label">Phone number</span>
        <input name="phone" type="tel" required inputMode="tel" autoComplete="tel" defaultValue={v.phone ?? ""} placeholder="0803 123 4567" />
        <span className="field__hint">The host uses this to reach you about the event.</span>
      </label>
      {fields.map((f) => (
        <label className="field" key={f.key}>
          <span className="field__label">{f.label}{!f.required && <small> (optional)</small>}</span>
          {f.type === "select" ? (
            <select name={`a_${f.key}`} required={f.required} defaultValue={v[`a_${f.key}`] ?? ""}>
              <option value="">{f.required ? "Choose one" : "Skip"}</option>
              {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input name={`a_${f.key}`} type={f.type === "email" ? "email" : "text"} inputMode={f.type === "email" ? "email" : undefined} autoComplete={f.type === "email" ? "email" : f.key === "org" ? "organization" : "off"} autoCapitalize={f.type === "email" ? "none" : undefined} required={f.required} maxLength={200} defaultValue={v[`a_${f.key}`] ?? ""} />
          )}
        </label>
      ))}
      <SubmitButton block pendingText="Saving your place…">RSVP for free</SubmitButton>
      <p className="small muted">Your details go to the host of this event. See Ganor&rsquo;s <a href="/privacy.html">privacy policy</a>.</p>
    </form>
  )
}
