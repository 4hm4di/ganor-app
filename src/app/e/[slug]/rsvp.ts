"use server"

import { createClient } from "@/lib/supabase/server"
import { checkStamp, deviceKey, netKey, rsvpKey, siteOrigin } from "@/lib/rsvp-guard"
import { sendTicketEmail } from "@/lib/mail"
import { formatDate, formatTime } from "@/lib/ganor"

export type RsvpState =
  | { status: "idle" | "error"; message?: string; values?: Record<string, string> }
  | { status: "ok"; code: string; ticket: string; name: string; link: string; phone: string; emailed: boolean }

// Free events. The database checks capacity, answers, duplicates and per-device/network limits;
// it only accepts calls carrying the server key, so these checks can't be skipped.
export async function submitRsvp(_prev: RsvpState, fd: FormData): Promise<RsvpState> {
  const values: Record<string, string> = {}
  fd.forEach((v, k) => { if (typeof v === "string" && !k.startsWith("$")) values[k] = v })
  const keep = { ...values }
  delete keep.stamp
  const fail = (message: string): RsvpState => ({ status: "error", message, values: keep })
  if (values.website) return fail("Something went wrong. Try again.") // honeypot for bots
  if (!rsvpKey()) return fail("RSVPs are paused for a moment. Try again shortly.")
  const stamp = checkStamp(values.event_id ?? "", values.stamp ?? "")
  if (stamp === "fast") return fail("That was quick! Check your details and press RSVP again.")
  if (stamp === "stale") return fail("This page has been open a long time. Refresh it and try again.")
  if (stamp === "bad") return fail("Refresh the page and try again.")

  const answers: Record<string, string> = {}
  for (const [k, v] of Object.entries(values)) if (k.startsWith("a_")) answers[k.slice(2)] = v.trim()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("rsvp_submit", {
    p_key: rsvpKey(),
    p_event: values.event_id ?? "",
    p_ticket_type: values.ticket_type ?? "",
    p_name: values.name ?? "",
    p_phone: values.phone ?? "",
    p_email: values.a_email ?? "",
    p_answers: answers,
    p_consent: values.consent === "1",
    p_device: await deviceKey(),
    p_net: await netKey(),
  })
  if (error) return fail(error.message.length < 160 ? error.message : "We couldn't save your RSVP. Try again.")

  const d = data as { code: string; ticket_type: string; event: string; starts_at: string; view_token: string; phone: string; email: string | null; venue: string }
  const link = `${await siteOrigin()}/t/${d.view_token}`
  const emailed = d.email
    ? await sendTicketEmail({ to: d.email, name: values.name ?? "", event: d.event, when: `${formatDate(d.starts_at, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · ${formatTime(d.starts_at)}`, venue: d.venue, ticket: d.ticket_type, code: d.code, link })
    : false
  return { status: "ok", code: d.code, ticket: d.ticket_type, name: values.name ?? "", link, phone: d.phone, emailed }
}
