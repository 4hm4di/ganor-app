import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { siteOrigin } from "@/lib/rsvp-guard"
import { formatDate, formatTime } from "@/lib/ganor"
import { Icon } from "@/components/Icon"
import { TicketQr } from "@/components/TicketQr"
import { TicketLinkActions } from "@/components/TicketLinkActions"

export const metadata: Metadata = {
  title: "Your ticket",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

type View = {
  name: string
  status: "paid" | "refunded"
  host: string | null
  event: { title: string; slug: string; starts_at: string; ends_at: string | null; venue_name: string; venue_address: string | null; city: string; status: string; cover_url: string | null }
  tickets: { code: string; type: string | null; checked_in: boolean }[]
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

  return (
    <div className="wrap tpage">
      <div className="card tcard">
        <span className="kicker"><Icon name="ticket" size={18} />Your ticket</span>
        <h1 className="tcard__title">{ev.title}</h1>
        <div className="ev-facts">
          <span><Icon name="calendar" />{formatDate(ev.starts_at, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          <span><Icon name="clock" />{formatTime(ev.starts_at)}{ev.ends_at ? ` – ${formatTime(ev.ends_at)}` : ""}</span>
          <span><Icon name="location" />{ev.venue_name}, {ev.city}</span>
        </div>
        {(cancelled || refunded) && (
          <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{cancelled ? "The host cancelled this event." : "This ticket was refunded and no longer lets you in."}</span></div>
        )}
        {!cancelled && !refunded && ended && <div className="alert alert--info" role="status"><Icon name="info" /><span>This event has ended.</span></div>}
        <p className="tcard__who">For <b>{v.name}</b>{v.host ? <> · hosted by {v.host}</> : null}</p>
        <ul className="tcard__list">
          {v.tickets.map((t) => (
            <li key={t.code} className={refunded || cancelled ? "is-void" : ""}>
              <TicketQr text={t.code} size={220} />
              <span className="rsvpok__code">{t.code}</span>
              <span className="small muted">{t.type ?? "Ticket"}{t.checked_in ? " · checked in" : ""}</span>
            </li>
          ))}
        </ul>
        <p className="small muted" style={{ textAlign: "center" }}>Show the QR code, or read out the code, at the gate. Turn your screen brightness up.</p>
        {!cancelled && !refunded && !ended && (
          <>
            <TicketLinkActions link={link} message={`My ticket for ${ev.title}: ${link}`} whatsappLabel="Send to WhatsApp" showOpen={false} />
            <div className="actions" style={{ justifyContent: "center", gap: 8 }}>
              <a className="btn btn--ghost btn--sm btn--plain" href={calendar} target="_blank" rel="noopener noreferrer"><Icon name="calendar" size={18} />Add to calendar</a>
              <a className="btn btn--ghost btn--sm btn--plain" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place}, Nigeria`)}`} target="_blank" rel="noopener noreferrer"><Icon name="map" size={18} />Directions</a>
            </div>
          </>
        )}
        <p className="small muted" style={{ textAlign: "center" }}>
          Keep this link private: anyone with it can open your ticket. <Link href={`/e/${ev.slug}`}>Event page</Link>
        </p>
      </div>
    </div>
  )
}
