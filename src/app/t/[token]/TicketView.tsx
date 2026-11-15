import Link from "next/link"
import { formatDate, formatTime } from "@/lib/ganor"
import { Icon } from "@/components/Icon"
import { TicketQr } from "@/components/TicketQr"
import { TicketLinkActions } from "@/components/TicketLinkActions"

export type View = {
  name: string
  status: "paid" | "refunded"
  host: string | null
  event: { title: string; slug: string; starts_at: string; ends_at: string | null; venue_name: string; venue_address: string | null; city: string; status: string; cover_url: string | null }
  tickets: { code: string; type: string | null; checked_in: boolean }[]
}

export function TicketView({ v, link, calendar, place, cancelled, refunded, ended }: { v: View; link: string; calendar: string; place: string; cancelled: boolean; refunded: boolean; ended: boolean }) {
  const ev = v.event
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
            <TicketLinkActions link={link} message={`My ticket for ${ev.title}: ${link}`} whatsappLabel="Send to WhatsApp" showOpen={false}
              extras={[{ href: calendar, label: "Add to calendar", icon: "calendar" }, { href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place}, Nigeria`)}`, label: "Directions", icon: "map" }]} />
          </>
        )}
        <p className="small muted" style={{ textAlign: "center" }}>
          Keep this link private: anyone with it can open your ticket. <Link href={`/e/${ev.slug}`}>Event page</Link>
        </p>
      </div>
    </div>
  )
}
