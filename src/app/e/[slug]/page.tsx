import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { cache, type ReactNode } from "react"
import { createClient, getUserId } from "@/lib/supabase/server"
import { RsvpForm } from "./RsvpForm"
import { parseRsvpFields } from "@/lib/rsvp"
import { planById } from "@/lib/plans"
import { Icon } from "@/components/Icon"
import { SocialIcon } from "@/components/SocialIcon"
import { ShareButtons } from "@/components/ShareButtons"
import { Stars } from "@/components/Stars"
import { HostRating } from "@/components/HostRating"
import { ReportReview } from "@/components/ReportReview"
import { CATEGORY_ICON, feeKobo, formatDate, formatNaira, formatTime , eventPhase, RATINGS_ENABLED } from "@/lib/ganor"
import { PhasePill } from "@/components/PhasePill"
import { formStamp } from "@/lib/rsvp-guard"

type Host = {
  display_name: string
  logo_url: string | null
  bio: string | null
  contact_whatsapp: string | null
  contact_phone: string | null
  contact_email: string | null
  website: string | null
  instagram: string | null
} | null

// Row Level Security returns published events to everyone, and drafts only to their host.
const getEvent = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("events")
    .select("*, ticket_types(*), profiles(display_name, logo_url, bio, contact_whatsapp, contact_phone, contact_email, website, instagram)")
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
    openGraph: {
      title: ev.title,
      description,
      type: "website",
      siteName: "Ganor",
      ...(ev.cover_url ? { images: [{ url: ev.cover_url, width: 1600, height: 800, alt: ev.title }] } : {}),
    },
    twitter: { card: ev.cover_url ? "summary_large_image" : "summary", title: ev.title, description, ...(ev.cover_url ? { images: [ev.cover_url] } : {}) },
  }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ev = await getEvent(slug)
  if (!ev) notFound()
  const { supabase, userId } = await getUserId()
  const isHost = userId === ev.host_id
  const [{ data: summary }, { data: reviews }] = !RATINGS_ENABLED ? [{ data: null }, { data: null }] : await Promise.all([
    supabase.from("host_review_summary").select("*").eq("host_id", ev.host_id).maybeSingle(),
    supabase
      .from("event_reviews")
      .select("id, rating, comment, display_name, attendance, publish_at, event_id")
      .eq("host_id", ev.host_id)
      .neq("comment", "")
      .order("publish_at", { ascending: false })
      .limit(5),
  ])
  const tickets = (ev.ticket_types ?? []).filter((t) => t.on_sale)
  // Guest limit = the plan actually paid for (an unpaid upgrade still counts as Free).
  const capPlan = ev.plan_paid_at ? ev.rsvp_plan : "free"
  const capLeft = ev.event_kind === "rsvp" ? Math.max(0, planById(capPlan).cap - tickets.filter((t) => t.price_kobo === 0).reduce((n, t) => n + t.sold, 0)) : Infinity
  const freeOptions = tickets.filter((t) => t.price_kobo === 0).map((t) => ({ id: t.id, name: t.name, left: Math.min(t.quantity - t.sold, capLeft) }))
  const host = ev.profiles as Host
  const phase = eventPhase(ev, ev.ticket_types)
  const ended = phase === "ended"
  const live = ev.status === "published"
  const h = await headers()
  const hostName = h.get("x-forwarded-host") ?? h.get("host") ?? "app.ganor.ng"
  const url = `${hostName.startsWith("localhost") ? "http" : "https"}://${hostName}/e/${ev.slug}`
  const when = `${formatDate(ev.starts_at)} · ${formatTime(ev.starts_at)}`
  const buyerPays = ev.fee_mode !== "absorb"
  const contacts = host
    ? [
        host.contact_whatsapp && { key: "wa", label: "WhatsApp", href: `https://wa.me/${host.contact_whatsapp}?text=${encodeURIComponent(`Hi, I have a question about ${ev.title}`)}`, icon: <SocialIcon name="whatsapp" size={18} /> },
        host.contact_phone && { key: "call", label: "Call", href: `tel:+${host.contact_phone}`, icon: <Icon name="phone" size={18} /> },
        host.contact_email && { key: "mail", label: "Email", href: `mailto:${host.contact_email}?subject=${encodeURIComponent(ev.title)}`, icon: <Icon name="mail" size={18} /> },
        host.website && { key: "web", label: host.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), href: host.website, icon: <Icon name="globe" size={18} /> },
        host.instagram && { key: "ig", label: `@${host.instagram}`, href: `https://instagram.com/${host.instagram}`, icon: <SocialIcon name="instagram" size={18} /> },
      ].filter(Boolean) as { key: string; label: string; href: string; icon: ReactNode }[]
    : []

  return (
    <>
      {ev.status !== "published" && (
        <div className="draftbar" role="status">
          {ev.status === "cancelled" ? "This event was cancelled." : "Preview: only you can see this page until you publish."}
          {isHost && <> <Link href={`/dashboard/events/${ev.id}`} style={{ color: "inherit" }}>Back to editing</Link></>}
        </div>
      )}
      <section className={`ev-hero${ev.cover_url ? " ev-hero--banner" : ""}`}>
        {ev.cover_url && (
          <div className="wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ev-banner" src={ev.cover_url} alt="" width={1600} height={800} fetchPriority="high" />
          </div>
        )}
        <div className="wrap ev-hero__in">
          <div className="actions" style={{ gap: 10 }}>
            <span className="kicker"><Icon name={CATEGORY_ICON[ev.category] ?? "calendar"} size={18} />{ev.category}</span>
            {phase !== "upcoming" && phase !== "draft" && <PhasePill phase={phase} />}
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
          {host && (
            <div className="card hostcard">
              <span className="kicker">Hosted by</span>
              <div className="hostcard__who">
                {host.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="hostcard__logo" src={host.logo_url} alt="" width={56} height={56} />
                ) : (
                  <span className="hostcard__logo hostcard__logo--empty" aria-hidden="true">{host.display_name.slice(0, 1).toUpperCase()}</span>
                )}
                <div>
                  <p className="hostcard__name">{host.display_name}</p>
                  {RATINGS_ENABLED && <HostRating summary={summary} />}
                  {host.bio && <p className="small muted" style={{ marginTop: 4 }}>{host.bio}</p>}
                </div>
              </div>
              {contacts.length > 0 ? (
                <div className="hostcard__links">
                  {contacts.map((c) => (
                    <a key={c.key} className="share__btn" href={c.href} target={c.key === "mail" ? undefined : "_blank"} rel="noopener noreferrer">
                      {c.icon}<span>{c.label}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="small muted">Questions about the event? Contact the host.</p>
              )}
            </div>
          )}
          {RATINGS_ENABLED && host && reviews && reviews.length > 0 && (
            <div className="card stack">
              <span className="kicker"><Icon name="star" size={18} />What guests say</span>
              <HostRating summary={summary} showSpread />
              <ul className="reviews">
                {reviews.map((r) => (
                  <li key={r.id}>
                    <div className="actions" style={{ gap: 8 }}>
                      <Stars value={r.rating} size={14} />
                      <span className={`badge${r.attendance === "scanned" ? " badge--ok" : ""}`}>{r.attendance === "scanned" ? "Attended" : "Ticket holder"}</span>
                    </div>
                    <p>{r.comment}</p>
                    <small>{r.display_name} · {formatDate(r.publish_at, { day: "numeric", month: "short", year: "numeric" })}{r.event_id !== ev.id ? " · another event" : ""}</small>
                    <ReportReview reviewId={r.id} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {RATINGS_ENABLED && host && live && ended && !isHost && (
            <div className="card stack">
              <span className="kicker"><Icon name="star" size={18} />Rate this event</span>
              <p className="small muted">Guests with a paid ticket get a private rating link on WhatsApp after the event, if they agreed to it at checkout. Lost yours? Email <a href="mailto:support@ganor.ng">support@ganor.ng</a> with your order number.</p>
            </div>
          )}
          {live && (
            <div className="card stack">
              <span className="kicker"><Icon name="share" size={18} />Share this event</span>
              <ShareButtons url={url} title={ev.title} text={`${ev.title} · ${when} · ${ev.venue_name}, ${ev.city}`} compact />
            </div>
          )}
        </div>

        <aside className="ev-side card stack" aria-labelledby="tickets-h">
          <span className="kicker"><Icon name="ticket" size={18} />Tickets</span>
          <h2 id="tickets-h" className="section-t">{ended ? "This event has ended" : tickets.length && tickets.every((t) => t.price_kobo === 0) ? "Free entry" : "Get your ticket"}</h2>
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
                    <div className="tt__end">
                      <span className="tt__price">{formatNaira(t.price_kobo)}</span>
                      {buyerPays && t.price_kobo > 0 && <small>+ {formatNaira(feeKobo(t.price_kobo))} fee</small>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="muted">Tickets will be added soon.</p>
          )}
          {!ended && live && freeOptions.length > 0 && (
            <div className="stack" style={{ gap: 12 }}>
              <h3 className="section-t" style={{ fontSize: 18 }}>RSVP</h3>
              <RsvpForm eventId={ev.id} eventTitle={ev.title} options={freeOptions} fields={parseRsvpFields(ev.rsvp_fields)} stamp={formStamp(ev.id)} full={capLeft <= 0} />
            </div>
          )}
          {!ended && tickets.some((t) => t.price_kobo > 0) && (
            <div className="alert alert--info"><Icon name="info" /><span>Ticket sales open soon. Pay by card, transfer or USSD, and get your ticket on WhatsApp.</span></div>
          )}
        </aside>
      </div>
    </>
  )
}
