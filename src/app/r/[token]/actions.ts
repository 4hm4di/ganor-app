"use server"

import { createClient } from "@/lib/supabase/server"

export type SubmitState = {
  status: "idle" | "ok" | "error"
  message?: string
  publishAt?: string
  counts?: boolean
  needsAttendance?: boolean
}

const ERRORS: Record<string, string> = {
  invalid: "This rating link isn't valid. Ask Ganor support for a new one.",
  revoked: "This rating link no longer works because the order was refunded or cancelled.",
  closed: "Ratings for this event have closed.",
  not_ended: "You can rate once the event has ended.",
  rating: "Choose from 1 to 5 stars.",
  comment: "Keep your comment to 500 characters.",
}

// Only a POST (this action) writes. Opening the link, or WhatsApp's link preview, changes nothing.
export async function submitRating(_prev: SubmitState, fd: FormData): Promise<SubmitState> {
  const token = String(fd.get("token") ?? "")
  const rating = Number(fd.get("rating"))
  const comment = String(fd.get("comment") ?? "")
  const display = fd.get("display") === "anonymous" ? "anonymous" : "initial"
  const attendedField = fd.get("attended")
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { status: "error", message: ERRORS.rating }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("submit_event_review", {
    p_token: token,
    p_rating: rating,
    p_comment: comment,
    p_display: display,
    p_attended: attendedField === "yes",
  })
  if (error || !data) return { status: "error", message: "Something went wrong. Please try again." }
  const res = data as { ok: boolean; error?: string; publish_at?: string; counts?: boolean }
  if (!res.ok) {
    if (res.error === "not_attended") {
      return { status: "error", needsAttendance: true, message: "Sorry you couldn't get in. Ratings are for guests who attended, so please tell Ganor support what happened at support@ganor.ng and we'll follow it up with the organiser privately." }
    }
    return { status: "error", message: ERRORS[res.error ?? ""] ?? "Something went wrong. Please try again." }
  }
  return { status: "ok", publishAt: res.publish_at, counts: res.counts }
}
