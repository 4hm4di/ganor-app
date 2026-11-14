import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient, getUserId } from "@/lib/supabase/server"
import { gateToken, type GateSession } from "@/lib/gate"
import { formatDate, formatTime } from "@/lib/ganor"
import { Scanner } from "./Scanner"
import { CloseLink } from "@/components/BackLink"
import { IdleGuard } from "@/components/IdleGuard"

export const metadata: Metadata = { title: "Scan tickets", robots: { index: false } }

// Open to the event's host (or Ganor staff) and to gate accounts assigned to this event.
// A browser can hold a host session and a gate session at once (a host testing a gate login).
// The two never mix: links from the dashboard open the scanner as the host (?as=host);
// anything else uses the gate account when it is signed in and assigned to this event.
export default async function ScanPage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ as?: string }> }) {
  const { eventId } = await params
  const preferHost = (await searchParams).as === "host"

  type Ev = { id: string; title: string; starts_at: string; venue: string; checked_in: number; total: number }
  type Found = { event: Ev; who: string; mode: "host" | "gate" }

  const asGate = async (): Promise<Found | null> => {
    const token = await gateToken()
    if (!token) return null
    const supabase = await createClient()
    const session = (await supabase.rpc("staff_session", { p_token: token })).data as GateSession | null
    const e = session?.events.find((x) => x.id === eventId)
    if (!session || !e) return null
    return { event: { id: e.id, title: e.title, starts_at: e.starts_at, venue: e.venue, checked_in: e.checked_in, total: e.total }, who: session.name, mode: "gate" }
  }
  const asHost = async (): Promise<Found | null> => {
    const { supabase: authed, userId } = await getUserId()
    if (!userId) return null
    const { data: e } = await authed.from("events").select("id, title, starts_at, venue_name, host_id").eq("id", eventId).maybeSingle()
    const staff = (await authed.rpc("is_staff")).data === true
    if (!e || (e.host_id !== userId && !staff)) return null
    const { data: rows } = await authed.from("tickets").select("checked_in_at, orders!inner(status)").eq("event_id", eventId).eq("orders.status", "paid")
    return {
      event: { id: e.id, title: e.title, starts_at: e.starts_at, venue: e.venue_name, checked_in: (rows ?? []).filter((r) => r.checked_in_at).length, total: (rows ?? []).length },
      who: e.host_id === userId ? "Host" : "Ganor staff",
      mode: "host",
    }
  }
  const found = preferHost ? (await asHost()) ?? (await asGate()) : (await asGate()) ?? (await asHost())
  if (!found) notFound()
  const { event, who, mode } = found

  return (
    <div className="wrap--narrow gate-page">
      {/* Hosts keep their usual idle sign-out while scanning; gate accounts have their own session. */}
      {mode === "host" && <IdleGuard />}
      <div className="gate-head">
        <div>
          <p className="small muted">{formatDate(event.starts_at)} · {formatTime(event.starts_at)} · {event.venue}</p>
          <h1 className="gate-title">{event.title}</h1>
        </div>
        <CloseLink href={mode === "host" ? `/dashboard/events/${event.id}` : "/gate"} label="Close scanner" />
      </div>
      <Scanner eventId={event.id} initialIn={event.checked_in} total={event.total} scannerName={who} mode={mode} />
    </div>
  )
}
