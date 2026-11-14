"use client"

import { useActionState } from "react"
import { findGuestTicket, type ResendState } from "./resend"
import { SubmitButton } from "@/components/SubmitButton"
import { TicketLinkActions } from "@/components/TicketLinkActions"
import { Icon } from "@/components/Icon"

export function ResendTicket({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [state, action] = useActionState<ResendState, FormData>(findGuestTicket, { status: "idle" })
  return (
    <details className="adder">
      <summary><Icon name="send" size={18} />Resend a guest&rsquo;s ticket</summary>
      <form action={action} className="resend">
        <input type="hidden" name="event_id" value={eventId} />
        <div className="resend__row">
          <label className="field"><span className="field__label">Guest&rsquo;s phone number</span>
            <input name="phone" type="tel" inputMode="tel" autoComplete="off" placeholder="0803 123 4567" defaultValue={state.status === "error" ? state.phone ?? "" : ""} required />
          </label>
          <SubmitButton size="sm" variant="outline" arrow={false} pendingText="Finding…">Find</SubmitButton>
        </div>
        {state.status === "error" && <p className="small" role="alert" style={{ color: "var(--ganor-danger, #C4314B)" }}>{state.message}</p>}
        {state.status === "ok" && (
          <div className="resend__hit" role="status">
            <span><b>{state.name}</b> <small className="muted">{state.phone}</small></span>
            <TicketLinkActions
              link={state.link}
              phone={state.phone}
              whatsappLabel="Send on WhatsApp"
              message={`Hi ${state.name.split(/\s+/)[0]}, here's your ticket for ${eventTitle}. Show the QR code at the gate: ${state.link}`}
            />
          </div>
        )}
        <p className="small muted">Only send a ticket link to the guest&rsquo;s own number. Anyone with the link can use the ticket.</p>
      </form>
    </details>
  )
}
