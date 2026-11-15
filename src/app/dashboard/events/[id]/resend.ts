"use server"

import { createClient } from "@/lib/supabase/server"
import { siteOrigin } from "@/lib/rsvp-guard"
import { flash } from "@/lib/flash"

export type ResendState =
  | { status: "idle" }
  | { status: "error"; message: string; phone?: string }
  | { status: "ok"; name: string; phone: string; link: string }

// Host looks a guest up by phone and gets their private ticket link to send on WhatsApp.
// The database only answers for the host's own event.
async function report(message: string, phone?: string): Promise<ResendState> {
  await flash("error", message)
  return { status: "error", message, phone }
}

export async function findGuestTicket(_prev: ResendState, fd: FormData): Promise<ResendState> {
  const eventId = String(fd.get("event_id") ?? "")
  const phone = String(fd.get("phone") ?? "").trim()
  if (!phone) return report("Enter the guest's phone number.")
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("host_find_guest", { p_event: eventId, p_phone: phone })
  if (error) return report(error.message.length < 120 ? error.message : "Couldn't look that up. Try again.", phone)
  const g = data as { name: string; phone: string; view_token: string } | null
  if (!g) return report("No guest with that number on this event.", phone)
  await flash("ok", `Found ${g.name}. Send them their ticket link.`)
  return { status: "ok", name: g.name, phone: g.phone, link: `${await siteOrigin()}/t/${g.view_token}` }
}
