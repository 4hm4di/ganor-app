import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient, getUserId } from "@/lib/supabase/server"
import { gateToken, type GateSession } from "@/lib/gate"
import { formatDate, formatTime } from "@/lib/ganor"
import { Scanner } from "./Scanner"

export const metadata: Metadata = { title: "Scan tickets", robots: { index: false } }

// Open to the event's host (or Ganor staff) and to gate accounts assigned to this event.
export default async function ScanPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const { supabase: authed, userId } = await getUserId()

  let ev: { id: string; title: string; starts_at: string; venue: string; checked_in: number; total: number } | null = null
  let who = ""
  if (userId) {
    const { data: e } = await authed.from("events").select("id, title, starts_at, venue_name, host_id").eq("id", eventId).maybeSingle()
    const staff = (await authed.rpc("is_staff")).data === true
    if (e && (e.host_id === userId || staff)) {
      const { data: rows } = await authed.from("tickets").select("checked_in_at, orders!inner(status)").eq("event_id", eventId).eq("orders.status", "paid")
      ev = { id: e.id, title: e.title, starts_at: e.starts_at, venue: e.venue_name, checked_in: (rows ?? []).filter((r) => r.checked_in_at).length, total: (rows ?? []).length }
      who = e.host_id === userId ? "Host" : "Ganor staff"
    }
  }
  if (!ev) {
    const token = await gateToken()
    if (token) {
      const supabase = await createClient()
      const session = (await supabase.rpc("staff_session", { p_token: token })).data as GateSession | null
      const e = session?.events.find((x) => x.id === eventId)
      if (e) {
        ev = { id: e.id, title: e.title, starts_at: e.starts_at, venue: e.venue, checked_in: e.checked_in, total: e.total }
        who = session!.name
      }
    }
  }
  if (!ev) notFound()

  return (
    <div className="wrap--narrow gate-page">
      <div className="gate-head">
        <div>
          <p className="small muted">{formatDate(ev.starts_at)} · {formatTime(ev.starts_at)} · {ev.venue}</p>
          <h1 className="gate-title">{ev.title}</h1>
        </div>
      </div>
      <Scanner eventId={ev.id} initialIn={ev.checked_in} total={ev.total} scannerName={who} />
    </div>
  )
}
