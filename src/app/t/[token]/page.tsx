import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { siteOrigin } from "@/lib/rsvp-guard"
import { TicketView, type View } from "./TicketView"

export const metadata: Metadata = {
  title: "Your ticket",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}


// Read once per request (kept out of render purity checks).
const nowMs = () => Date.now()
const gcal = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")

// A guest's private ticket. The link (sent by the guest to their own WhatsApp, emailed, or resent by
// the host) is the only key; there is no account to sign in to.
export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!/^[0-9a-f]{32}$/.test(token)) notFound()
  const supabase = await createClient()
  const { data } = await supabase.rpc("ticket_view", { p_token: token })
  const v = data as View | null
  if (!v) notFound()
  const ev = v.event
  const link = `${await siteOrigin()}/t/${token}`
  const end = ev.ends_at ?? new Date(new Date(ev.starts_at).getTime() + 3 * 3_600_000).toISOString()
  const place = [ev.venue_name, ev.venue_address, ev.city].filter(Boolean).join(", ")
  const calendar = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${gcal(ev.starts_at)}/${gcal(end)}&location=${encodeURIComponent(place)}&details=${encodeURIComponent(`Your ticket: ${link}`)}`
  const cancelled = ev.status === "cancelled"
  const refunded = v.status === "refunded"
  const ended = new Date(end).getTime() < nowMs()

  return <TicketView v={v} link={link} calendar={calendar} place={place} cancelled={cancelled} refunded={refunded} ended={ended} />
}
