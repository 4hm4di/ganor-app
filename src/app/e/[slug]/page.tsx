import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { cache, type ReactNode } from "react"
import { createClient, getUserId } from "@/lib/supabase/server"
import { Icon } from "@/components/Icon"
import { SocialIcon } from "@/components/SocialIcon"
import { ShareButtons } from "@/components/ShareButtons"
import { CATEGORY_ICON, feeKobo, formatDate, formatNaira, formatTime } from "@/lib/ganor"

type Host = {
  display_name: string
  logo_url: string | null
  bio: string | null
  contact_whatsapp: string | null
  contact_email: string | null
  website: string | null
  instagram: string | null
} | null

// Row Level Security returns published events to everyone, and drafts only to their host.
const getEvent = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("events")
    .select("*, ticket_types(*), profiles(display_name, logo_url, bio, contact_whatsapp, contact_email, website, instagram)")
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
  const { userId } = await getUserId()
  const isHost = userId === ev.host_id
  const tickets = ev.ticket_types ?? []
  const host = ev.profiles as Host
  const ended = new Date(ev.ends_at ?? ev.starts_at) < new Date()
  const live = ev.status === "published"
  const h = await headers()
  const hostName = h.get("x-forwarded-host") ?? h.get("host") ?? "ganor-app.vercel.app"
  const url = `${hostName.startsWith("localhost") ? "http" : "https"}://${hostName}/e/${ev.slug}`
  const when = `${formatDate(ev.starts_at)} · ${formatTime(ev.starts_at)}`
  const buyerPays = ev.fee_mode !== "absorb"
  const contacts = host
    ? [
        host.contact_whatsapp && { key: "wa", label: "WhatsApp", href: `https://wa.me/${host.contact_whatsapp}?text=${encodeURIComponent(`Hi, I have a question about ${ev.title}`)}`, icon: <SocialIcon name="whatsapp" size={18} /> },
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
                  {host.bio && <p className="small muted">{host.bio}</p>}
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
          {live && (
            <div className="card stack">
              <span className="kicker"><Icon name="share" size={18} />Share this event</span>
              <ShareButtons url={url} title={ev.title} text={`${ev.title} · ${when} · ${ev.venue_name}, ${ev.city}`} compact />
            </div>
          )}
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
          {!ended && (
            <div className="alert alert--info"><Icon name="info" /><span>Ticket sales open soon. Pay by card, transfer or USSD, and get your ticket on WhatsApp.</span></div>
          )}
        </aside>
      </div>
    </>
  )
}
