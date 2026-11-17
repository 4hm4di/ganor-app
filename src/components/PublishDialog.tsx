"use client"

import { useRef, useState } from "react"
import { Icon } from "@/components/Icon"
import { SubmitButton } from "@/components/SubmitButton"

export type Visibility = "public" | "private"

export const VISIBILITY = {
  public: { icon: "globe", label: "Public", line: "Listed on Ganor Find events and in search, and shareable by link." },
  private: { icon: "lock", label: "Private", line: "Not listed on Find events or in search. Only people you send the link to can open it." },
} as const

function Options({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  return (
    <fieldset className="vis">
      <legend className="sr-only">Who can find this event</legend>
      {(Object.keys(VISIBILITY) as Visibility[]).map((k) => (
        <label key={k} className={`vis__o${value === k ? " is-on" : ""}`}>
          <input type="radio" name="visibility" value={k} checked={value === k} onChange={() => onChange(k)} />
          <span className="vis__ic" aria-hidden="true"><Icon name={VISIBILITY[k].icon} size={20} /></span>
          <span><b>{VISIBILITY[k].label}</b><small>{VISIBILITY[k].line}</small></span>
        </label>
      ))}
    </fieldset>
  )
}

// Publish asks who should be able to find the event before it goes live.
export function PublishDialog({ eventId, action, initial = "public" }: { eventId: string; action: (fd: FormData) => void | Promise<void>; initial?: Visibility }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [vis, setVis] = useState<Visibility>(initial)
  return (
    <>
      <button type="button" className="btn btn--primary btn--sm" onClick={() => ref.current?.showModal()}>
        <span>Publish</span><span className="btn__arrow" aria-hidden="true"><Icon name="arrow" /></span>
      </button>
      <dialog ref={ref} className="pubdlg" aria-labelledby="pubdlg-title" onClick={(e) => { if (e.target === ref.current) ref.current?.close() }}>
        <form action={action} className="stack pubdlg__body">
          <input type="hidden" name="id" value={eventId} />
          <div className="pubdlg__head">
            <h2 id="pubdlg-title">Publish your event</h2>
            <button type="button" className="iconbtn" aria-label="Close" onClick={() => ref.current?.close()}><Icon name="close-circle" size={20} /></button>
          </div>
          <p className="muted small">Who should be able to find it? You can change this later.</p>
          <Options value={vis} onChange={setVis} />
          <div className="actions" style={{ justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="btn btn--ghost btn--sm btn--plain" onClick={() => ref.current?.close()}>Not yet</button>
            <SubmitButton name="to" value="published" size="sm" pendingText="Publishing…">{vis === "public" ? "Publish publicly" : "Publish privately"}</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  )
}

// After publishing: switch between public and private in place.
export function VisibilitySwitch({ eventId, value, action }: { eventId: string; value: Visibility; action: (fd: FormData) => void | Promise<void> }) {
  const other: Visibility = value === "public" ? "private" : "public"
  return (
    <form action={action} className="visnow">
      <input type="hidden" name="id" value={eventId} />
      <input type="hidden" name="visibility" value={other} />
      <span className="visnow__now"><Icon name={VISIBILITY[value].icon} size={18} /><span><b>{VISIBILITY[value].label}</b> · {value === "public" ? "listed on Find events" : "only people with the link"}</span></span>
      <SubmitButton variant="outline" size="xs" arrow={false} pendingText="Saving…">{value === "public" ? "Make private" : "Make public"}</SubmitButton>
    </form>
  )
}
