"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

// Anyone can flag a review. Ganor staff review flags (we aim to act within 24 hours).
export function ReportReview({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  if (state === "sent") return <small role="status">Thanks. Ganor will look at this review.</small>
  if (!open) return <button type="button" className="linkbtn" onClick={() => setOpen(true)}>Report</button>
  return (
    <form
      className="stack"
      style={{ gap: 8 }}
      onSubmit={async (e) => {
        e.preventDefault()
        const reason = String(new FormData(e.currentTarget).get("reason") ?? "").trim()
        if (reason.length < 3) return
        setState("sending")
        const { error } = await createClient().from("review_reports").insert({ review_id: reviewId, reason })
        setState(error ? "error" : "sent")
      }}
    >
      <label className="field">
        <span className="field__label">What&rsquo;s wrong with this review?</span>
        <input name="reason" required minLength={3} maxLength={500} autoComplete="off" placeholder="False, abusive, or not from a guest…" />
      </label>
      <div className="actions" style={{ gap: 8 }}>
        <button type="submit" className="btn btn--primary btn--xs btn--plain" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send report"}</button>
        <button type="button" className="btn btn--ghost btn--xs btn--plain" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {state === "error" && <small role="alert">Couldn&rsquo;t send. Email support@ganor.ng instead.</small>}
    </form>
  )
}
