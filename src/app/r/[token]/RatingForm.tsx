"use client"

import { Fragment, useActionState } from "react"
import { submitRating, type SubmitState } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"
import { STAR_PATH } from "@/components/Stars"
import { REVIEW_PUBLIC_NOTICE } from "@/lib/consent"
import { formatDate } from "@/lib/ganor"

type Existing = { rating: number; comment: string; display_mode: "initial" | "anonymous" } | null

export function RatingForm({ token, firstName, host, attended, expires, existing }: {
  token: string
  firstName: string
  host: string
  attended: boolean
  expires: string
  existing: Existing
}) {
  const [state, action] = useActionState<SubmitState, FormData>(submitRating, { status: "idle" })

  if (state.status === "ok") {
    return (
      <div className="stack" role="status">
        <span className="kicker"><Icon name="check-circle" size={18} />Thank you, {firstName}</span>
        <h2>Your rating is saved</h2>
        <p className="muted">
          It goes public on {state.publishAt ? formatDate(state.publishAt) : "the event page"}, together with other guests&rsquo; ratings.
          {state.counts ? " It counts towards the organiser's score because your ticket was scanned at the gate." : " It shows as a ticket holder's review. Only ratings from guests scanned at the gate count towards the organiser's score."}
        </p>
        <p className="small muted">You can change it with the same link until {expires}.</p>
      </div>
    )
  }

  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="token" value={token} />
      <fieldset className="starpick">
        <legend className="field__label">Rate {host}&rsquo;s event</legend>
        <div className="starpick__row">
          {[5, 4, 3, 2, 1].map((n) => (
            <Fragment key={n}>
              <input type="radio" name="rating" id={`star-${n}`} value={n} defaultChecked={existing?.rating === n} required />
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
        <textarea name="comment" rows={4} maxLength={500} autoComplete="off" defaultValue={existing?.comment ?? ""} placeholder="Started on time, easy entry, good venue…" />
      </label>

      {!attended && (
        <fieldset className="choice">
          <legend className="field__label">Your ticket wasn&rsquo;t scanned. Did you get in?</legend>
          <label><input type="radio" name="attended" value="yes" defaultChecked={!!existing} /> Yes, I attended</label>
          <label><input type="radio" name="attended" value="no" /> No, I couldn&rsquo;t get in</label>
        </fieldset>
      )}

      <fieldset className="choice">
        <legend className="field__label">Show my name as</legend>
        <label><input type="radio" name="display" value="initial" defaultChecked={existing?.display_mode !== "anonymous"} /> {firstName} + last initial</label>
        <label><input type="radio" name="display" value="anonymous" defaultChecked={existing?.display_mode === "anonymous"} /> {attended ? "Verified attendee" : "Ticket holder"}</label>
      </fieldset>

      <p className="small muted">{REVIEW_PUBLIC_NOTICE}</p>
      {state.status === "error" && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>}
      <SubmitButton pendingText="Saving…">{existing ? "Update rating" : "Submit rating"}</SubmitButton>
    </form>
  )
}
