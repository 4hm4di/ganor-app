"use client"

import { useActionState, useState } from "react"
import { createRatingLinks, reissueRatingLink, suppressPhone, type SendLink, type SendState } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"

function LinkList({ links }: { links: SendLink[] }) {
  const [sent, setSent] = useState<Record<string, boolean>>({})
  return (
    <ul className="sendlist">
      {links.map((l) => (
        <li key={l.inviteId}>
          <span>
            <b>{l.name}</b>
            <small>{l.phone} · {l.attended ? "scanned" : "not scanned"}</small>
          </span>
          <span className="actions" style={{ gap: 6 }}>
            <button type="button" className="btn btn--ghost btn--xs btn--plain" onClick={() => navigator.clipboard?.writeText(l.link)}>Copy link</button>
            <a className={`btn btn--xs btn--plain ${sent[l.inviteId] ? "btn--ghost" : "btn--primary"}`} href={l.whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => setSent((s) => ({ ...s, [l.inviteId]: true }))}>
              {sent[l.inviteId] ? "Opened" : "Send on WhatsApp"}
            </a>
          </span>
        </li>
      ))}
    </ul>
  )
}

export function CreateLinks({ eventId, disabled }: { eventId: string; disabled?: boolean }) {
  const [state, action] = useActionState<SendState, FormData>(createRatingLinks, { status: "idle" })
  return (
    <div className="stack" style={{ gap: 10 }}>
      <form action={action}>
        <input type="hidden" name="event_id" value={eventId} />
        <SubmitButton size="sm" arrow={false} pendingText="Creating links…" disabled={disabled}>Create rating links</SubmitButton>
      </form>
      {state.message && <p className={`small ${state.status === "error" ? "" : "muted"}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
      {state.links && state.links.length > 0 && (
        <>
          <p className="small muted">Each link is shown once. Send them now; if one gets lost, use &ldquo;New link&rdquo; below.</p>
          <LinkList links={state.links} />
        </>
      )}
    </div>
  )
}

export function Reissue({ inviteId }: { inviteId: string }) {
  const [state, action] = useActionState<SendState, FormData>(reissueRatingLink, { status: "idle" })
  if (state.links?.length) return <LinkList links={state.links} />
  return (
    <form action={action}>
      <input type="hidden" name="invite_id" value={inviteId} />
      <SubmitButton size="xs" variant="ghost" arrow={false} pendingText="Making…">New link</SubmitButton>
      {state.status === "error" && <small role="alert"> {state.message}</small>}
    </form>
  )
}

export function StopForm() {
  const [state, action] = useActionState<SendState, FormData>(suppressPhone, { status: "idle" })
  return (
    <form action={action} className="stack" noValidate>
      <div className="grid2">
        <label className="field"><span className="field__label">WhatsApp number that replied STOP</span>
          <input name="phone" type="tel" inputMode="tel" autoComplete="off" required placeholder="0803 000 0000" />
        </label>
        <label className="field"><span className="field__label">Stop</span>
          <select name="scope" defaultValue="rating_request">
            <option value="rating_request">Rating requests</option>
            <option value="all">All Ganor messages except tickets they buy</option>
          </select>
        </label>
      </div>
      {state.message && <div className={`alert ${state.status === "error" ? "alert--error" : "alert--ok"}`} role="status"><Icon name={state.status === "error" ? "warning" : "check-circle"} /><span>{state.message}</span></div>}
      <SubmitButton size="sm" arrow={false} pendingText="Saving…">Add to STOP list</SubmitButton>
    </form>
  )
}
