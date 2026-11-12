"use client"

import { Fragment, useActionState } from "react"
import { rateHost, type RateState } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"
import { STAR_PATH } from "@/components/Stars"

export function RateHost({ eventId, slug, host, mine }: { eventId: string; slug: string; host: string; mine: { stars: number; comment: string } | null }) {
  const [state, action] = useActionState<RateState, FormData>(rateHost, { status: "idle" })
  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />
      <fieldset className="starpick">
        <legend className="field__label">How was {host}?</legend>
        <div className="starpick__row">
          {[5, 4, 3, 2, 1].map((n) => (
            <Fragment key={n}>
              <input type="radio" name="stars" id={`star-${n}`} value={n} defaultChecked={mine?.stars === n} required />
              <label htmlFor={`star-${n}`}>
                <svg width={32} height={32} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={STAR_PATH} /></svg>
                <span className="sr">{n} {n === 1 ? "star" : "stars"}</span>
              </label>
            </Fragment>
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span className="field__label">Tell other guests <small>(optional)</small></span>
        <textarea name="comment" rows={3} maxLength={280} defaultValue={mine?.comment ?? ""} placeholder="Started on time, easy entry, good venue…" />
      </label>
      {state.status === "error" && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>}
      {state.status === "ok" && <div className="alert alert--ok" role="status"><Icon name="check-circle" /><span>{state.message}</span></div>}
      <SubmitButton size="sm" pendingText="Saving…">{mine ? "Update rating" : "Rate host"}</SubmitButton>
    </form>
  )
}
