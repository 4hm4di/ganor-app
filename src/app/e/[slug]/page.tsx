import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cache } from "react"
import { createClient, getUserId } from "@/lib/supabase/server"
import { Icon } from "@/components/Icon"
import { CATEGORY_ICON, formatDate, formatNaira, formatTime } from "@/lib/ganor"

// Row Level Security returns published events to everyone, and drafts only to their host.
const getEvent = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("events")
    .select("*, ticket_types(*), profiles(display_name)")
    .eq("slug", slug)
    .order("sort_order", { referencedTable: "ticket_types", ascending: true })
    .maybeSingle()
  return data
})

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const ev = await getEvent(slug)
  if (!ev) return { title: "Event not found" }
  const when = `${formatDate(ev.starts_at)} · ${formatTime(ev.starts_at)}`
  const description = `${when} · ${ev.venue_name}, ${ev.city}. Get your ticket on Ganor.`
  return {
    title: ev.title,
    description,
    robots: ev.status === "published" ? undefined : { index: false, follow: false },
    openGraph: { title: ev.title, description, type: "website", siteName: "Ganor" },
    twitter: { card: "summary", title: ev.title, description },
  }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ev = await getEvent(slug)
  if (!ev) notFound()
  const { userId } = await getUserId()
  const isHost = userId === ev.host_id
  const tickets = ev.ticket_types ?? []
  const host = (ev.profiles as { display_name: string } | null)?.display_name
  const ended = new Date(ev.ends_at ?? ev.starts_at) < new Date()

  return (
    <>
      {ev.status !== "published" && (
        <div className="draftbar" role="status">
          {ev.status === "cancelled" ? "This event was cancelled." : "Preview: only you can see this page until you publish."}
          {isHost && <> <Link href={`/dashboard/events/${ev.id}`} style={{ color: "inherit" }}>Back to editing</Link></>}
        </div>
      )}
      <section className="ev-hero">
        <div className="wrap ev-hero__in">
          <div className="actions" style={{ gap: 10 }}>
            <span className="kicker"><Icon name={CATEGORY_ICON[ev.category] ?? "calendar"} size={18} />{ev.category}</span>
            {ev.halal_friendly && <span className="pill pill--halal"><Icon name="halal" size={14} />Halal-friendly</span>}
          </div>
          <h1>{ev.title}</h1>
          <div className="ev-facts">
            <span><Icon name="calendar" />{formatDate(ev.starts_at, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
            <span><Icon name="clock" />{formatTime(ev.starts_at)}{ev.ends_at ? ` – ${formatTime(ev.ends_at)}` : ""}</span>
            <span><Icon name="location" />{ev.venue_name}, {ev.city}</span>
          </div>
        </div>
      </section>

      <div className="wrap ev-body">
        <div className="stack">
          {ev.description ? (
            <div className="card">
              <span className="kicker">About</span>
              <p className="prose" style={{ marginTop: 12 }}>{ev.description}</p>
            </div>
          ) : null}
          <div className="card stack">
            <span className="kicker"><Icon name="location" size={18} />Where</span>
            <div>
              <p style={{ fontWeight: 700 }}>{ev.venue_name}</p>
              <p className="muted">{[ev.venue_address, ev.city].filter(Boolean).join(", ")}</p>
            </div>
            <a
              className="btn btn--ghost btn--sm btn--plain"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([ev.venue_name, ev.venue_address, ev.city, "Nigeria"].filter(Boolean).join(", "))}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ justifySelf: "start" }}
            >
              Open in Maps
            </a>
          </div>
          {host && <p className="small muted">Hosted by <b style={{ color: "var(--ganor-ink)" }}>{host}</b>. Questions about the event? Contact the host.</p>}
        </div>

        <aside className="ev-side card stack" aria-labelledby="tickets-h">
          <span className="kicker"><Icon name="ticket" size={18} />Tickets</span>
          <h2 id="tickets-h" className="section-t">{ended ? "This event has ended" : "Get your ticket"}</h2>
          {tickets.length ? (
            <div className="tt">
              {tickets.map((t) => {
                const left = t.quantity - t.sold
                return (
                  <div className="tt__row" key={t.id}>
                    <div>
                      <div className="tt__name">{t.name}</div>
                      <div className="tt__meta">{left <= 0 ? "Sold out" : t.description || `${left} left`}</div>
                    </div>
                    <span className="tt__price">{formatNaira(t.price_kobo)}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="muted">Tickets will be added soon.</p>
          )}
          {!ended && (
            <div className="alert alert--info"><Icon name="info" /><span>Ticket sales open soon. Pay by card, transfer or USSD, and get your ticket on WhatsApp.</span></div>
          )}
        </aside>
      </div>
    </>
  )
}
