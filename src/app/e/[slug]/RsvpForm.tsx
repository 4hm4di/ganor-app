"use client"

import { useActionState } from "react"
import { submitRsvp, type RsvpState } from "./rsvp"
import { TicketQr } from "@/components/TicketQr"
import { TicketLinkActions } from "@/components/TicketLinkActions"
import type { RsvpField } from "@/lib/rsvp"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"

export function RsvpForm({ eventId, eventTitle, options, fields, stamp, full }: { eventId: string; eventTitle: string; options: { id: string; name: string; left: number }[]; fields: RsvpField[]; stamp: string; full?: boolean }) {
  const [state, action] = useActionState<RsvpState, FormData>(submitRsvp, { status: "idle" })
  const open = options.filter((o) => o.left > 0)

  if (state.status === "ok") {
    const first = state.name.split(/\s+/)[0]
    return (
      <div className="rsvpok" role="status">
        <Icon name="check-circle" size={36} />
        <b style={{ font: "800 22px/28px var(--ganor-font-display)" }}>You&rsquo;re on the list, {first}</b>
        <span className="small muted">{state.ticket} · {eventTitle}</span>
        <TicketQr text={state.code} />
        <span className="rsvpok__code">{state.code}</span>
        <div className="rsvpok__save">
          <b>Save your ticket now</b>
          <span className="small muted">Send the link to your own WhatsApp so it&rsquo;s there on event day.{state.emailed ? " We also emailed it to you." : ""}</span>
          <TicketLinkActions link={state.link} phone={state.phone} message={`My ticket for ${eventTitle} (${state.code}): ${state.link}`} />
        </div>
        <span className="small muted">Show the QR code or read out the code at the gate. Keep the link private: anyone with it can open your ticket.</span>
      </div>
    )
  }
  if (full || !open.length) {
    return (
      <div className="alert alert--info" role="status"><Icon name="info" /><span><b>This event is full.</b> Already registered? Open the ticket link you saved, or ask the host to resend it.</span></div>
    )
  }
  const v = state.status === "error" ? state.values ?? {} : {}

  return (
    <form action={action} className="rsvpf" key={state.status === "error" ? JSON.stringify(v) : "f"} noValidate>
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="stamp" value={stamp} />
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
