"use server"

import { createClient } from "@/lib/supabase/server"
import { siteOrigin } from "@/lib/rsvp-guard"

export type ResendState =
  | { status: "idle" }
  | { status: "error"; message: string; phone?: string }
  | { status: "ok"; name: string; phone: string; link: string }

// Host looks a guest up by phone and gets their private ticket link to send on WhatsApp.
// The database only answers for the host's own event.
export async function findGuestTicket(_prev: ResendState, fd: FormData): Promise<ResendState> {
  const eventId = String(fd.get("event_id") ?? "")
  const phone = String(fd.get("phone") ?? "").trim()
  if (!phone) return { status: "error", message: "Enter the guest's phone number." }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("host_find_guest", { p_event: eventId, p_phone: phone })
  if (error) return { status: "error", message: error.message.length < 120 ? error.message : "Couldn't look that up. Try again.", phone }
  const g = data as { name: string; phone: string; view_token: string } | null
  if (!g) return { status: "error", message: "No guest with that number on this event.", phone }
  return { status: "ok", name: g.name, phone: g.phone, link: `${await siteOrigin()}/t/${g.view_token}` }
}
