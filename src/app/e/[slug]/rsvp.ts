"use server"

import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export type RsvpState =
  | { status: "idle" | "error"; message?: string; values?: Record<string, string> }
  | { status: "ok"; code: string; ticket: string; name: string }

// Free events: one RSVP per phone number. The database checks capacity, required answers and duplicates.
export async function submitRsvp(_prev: RsvpState, fd: FormData): Promise<RsvpState> {
  const values: Record<string, string> = {}
  fd.forEach((v, k) => { if (typeof v === "string" && !k.startsWith("$")) values[k] = v })
  if (values.website) return { status: "error", message: "Something went wrong. Try again.", values } // honeypot for bots
  const answers: Record<string, string> = {}
  for (const [k, v] of Object.entries(values)) if (k.startsWith("a_")) answers[k.slice(2)] = v.trim()
  const h = await headers()
  void h // request-scoped (keeps this dynamic)
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("rsvp_submit", {
    p_event: values.event_id ?? "",
    p_ticket_type: values.ticket_type ?? "",
    p_name: values.name ?? "",
    p_phone: values.phone ?? "",
    p_email: values.a_email ?? "",
    p_answers: answers,
    p_consent: values.consent === "1",
  })
  if (error) {
    const msg = /P0001|raise/i.test(error.code ?? "") || error.message.length < 120 ? error.message : "We couldn't save your RSVP. Try again."
    return { status: "error", message: msg, values }
  }
  const d = data as { code: string; ticket_type: string }
  return { status: "ok", code: d.code, ticket: d.ticket_type, name: values.name ?? "" }
}
