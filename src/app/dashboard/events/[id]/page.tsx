import type { Metadata } from "next"
import type { CSSProperties } from "react"
import Link from "next/link"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { EventForm } from "../../EventForm"
import { TicketForm } from "../../TicketForm"
import { TicketRow } from "../../TicketRow"
import { FeeSeg } from "../../FeeSeg"
import { Reveal } from "../../Reveal"
import { deleteDraft, saveEventBanner, setEventStatus } from "../../actions"
import { SubmitButton } from "@/components/SubmitButton"
import { ImageUpload } from "@/components/ImageUpload"
import { ShareButtons } from "@/components/ShareButtons"
import { GanorSymbol } from "@/components/Loader"
import { Icon } from "@/components/Icon"
import { feeKobo, formatDate, formatNaira, formatTime, isoToLagosLocal } from "@/lib/ganor"

export const metadata: Metadata = { title: "Event tools" }

const ERRORS: Record<string, string> = {
  tickets: "Add at least one ticket type before you publish.",
  past: "This event's start time has passed. Change the date before you publish.",
  notfound: "We couldn't find that event.",
}

const naira = (k: number) => (k > 0 ? formatNaira(k) : "₦0")
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("")

// The last seven days in Lagos, oldest first, for the Tickets sold chart.
function lastSevenDays() {
  const day = 86_400_000
  return Array.from({ length: 7 }, (_, i) => formatDate(new Date(Date.now() - (6 - i) * day).toISOString(), { weekday: "short" }))
}

// Chart geometry matches the landing page SVG: 600 × 180, baseline at 170, top at 22.
function chartPath(values: number[]) {
  const max = Math.max(1, ...values)
  const pts = values.map((v, i) => [Math.round((i / (values.length - 1)) * 600), Math.round(170 - (v / max) * 148)] as const)
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ")
  return { line, area: `${line} L600 180 L0 180Z`, last: pts[pts.length - 1]! }
}

export default async function EventTools({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string; published?: string; error?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const { supabase, userId } = await getUserId()
  if (!userId) redirect("/login")

  const { data: ev } = await supabase
    .from("events")
    .select("*, ticket_types(*)")
    .eq("id", id)
    .eq("host_id", userId)
    .order("sort_order", { referencedTable: "ticket_types", ascending: true })
    .single()
  if (!ev) notFound()

  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "ganor-app.vercel.app"
  const publicPath = `/e/${ev.slug}`
  const publicUrl = `${host.startsWith("localhost") ? "http" : "https"}://${host}${publicPath}`
  const tickets = ev.ticket_types ?? []
  const live = ev.status === "published"
  const when = `${formatDate(ev.starts_at)} · ${formatTime(ev.starts_at)}`

  const total = tickets.reduce((n, t) => n + t.quantity, 0)
  const sold = tickets.reduce((n, t) => n + t.sold, 0)
  const absorb = ev.fee_mode === "absorb"
  const takeHome = (price: number) => (absorb ? Math.max(0, price - feeKobo(price)) : price)
  const earned = tickets.reduce((n, t) => n + takeHome(t.price_kobo) * t.sold, 0)
  const hasPaid = tickets.some((t) => t.price_kobo > 0)

  // Daily sales arrive with checkout; until then every day is zero.
  const days = lastSevenDays()
  const daily = days.map(() => 0)
  const chart = chartPath(daily)
  const today = daily[daily.length - 1]!
  const checkedIn = 0
  const guests: { name: string; ticket: string; in: boolean }[] = []

  return (
    <div className="wrap">
      <div className="pagehead">
        <div>
          <div className="actions" style={{ gap: 8 }}>
            <span className={`pill pill--${ev.status}`}>{live ? "Live" : ev.status === "draft" ? "Draft" : "Cancelled"}</span>
            {ev.halal_friendly && <span className="pill pill--halal"><Icon name="halal" size={14} />Halal-friendly</span>}
          </div>
          <h1 style={{ marginTop: 10 }}>{ev.title}</h1>
          <p className="muted">{when} · {ev.venue_name}, {ev.city}</p>
        </div>
        <div className="actions">
          <Link href={publicPath} className="btn btn--ghost btn--sm btn--plain" target="_blank">{live ? "View page" : "Preview"}</Link>
          <form action={setEventStatus}>
            <input type="hidden" name="id" value={ev.id} />
            {live ? (
              <SubmitButton name="to" value="draft" variant="outline" size="sm" arrow={false} pendingText="Unpublishing">Unpublish</SubmitButton>
            ) : (
              <SubmitButton name="to" value="published" size="sm" pendingText="Publishing">Publish</SubmitButton>
            )}
          </form>
        </div>
      </div>

      {sp.created && <div className="alert alert--ok" role="status" style={{ marginBottom: 14 }}><Icon name="check-circle" /><span>Event created as a draft. Add a banner and your ticket types, then publish.</span></div>}
      {sp.published && <div className="alert alert--ok" role="status" style={{ marginBottom: 14 }}><Icon name="check-circle" /><span>Your event is live. Share the link below.</span></div>}
      {sp.error && <div className="alert alert--error" role="alert" style={{ marginBottom: 14 }}><Icon name="warning" /><span>{ERRORS[sp.error] ?? "Something went wrong."}</span></div>}

      <div className="bento">
        <article className="card card--sales">
          <header className="card__head"><h2 className="card__title"><Icon name="receipt" />Tickets sold</h2><span className="card__tag">{live ? "Live" : "Draft"}</span></header>
          <p className="card__big"><span>{sold}</span><small> of {total}</small></p>
          <div className="chart">
            <svg viewBox="0 0 600 180" preserveAspectRatio="none" aria-hidden="true">
              <defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3730B8" stopOpacity=".16" /><stop offset="1" stopColor="#3730B8" stopOpacity="0" /></linearGradient></defs>
              <g className="chart__grid"><line x1="0" x2="600" y1="45" y2="45" /><line x1="0" x2="600" y1="90" y2="90" /><line x1="0" x2="600" y1="135" y2="135" /></g>
              <path className="chart__area" d={chart.area} fill="url(#fill)" />
              <path className="chart__line" pathLength={1} d={chart.line} />
            </svg>
            <span className="chart__dot" aria-hidden="true" style={{ left: "100%", top: `${(chart.last[1] / 180) * 100}%` }} />
            <p className="chart__tip" style={{ left: "100%", top: `${(chart.last[1] / 180) * 100}%`, transform: "translate(-100%, calc(-100% - 14px))" }}>
              {days[days.length - 1]} · {today} sold
            </p>
          </div>
          <p className="card__foot">{days.map((d, i) => <span key={i}>{d}</span>)}</p>
        </article>

        <article className="card card--types">
          <header className="card__head"><h2 className="card__title"><Icon name="ticket" />Ticket types</h2><span className="card__tag">{tickets.length} {tickets.length === 1 ? "type" : "types"}</span></header>
          {tickets.length > 0 ? (
            <ul className="types">{tickets.map((t) => <TicketRow key={t.id} t={t} />)}</ul>
          ) : (
            <p className="card__empty">No tickets yet. Add Regular, VIP, Student or a free RSVP.</p>
          )}
          <details className="adder" open={tickets.length === 0}>
            <summary><Icon name="add-circle" size={18} />Add ticket type</summary>
            <div className="adder__body"><TicketForm eventId={ev.id} first={tickets.length === 0} /></div>
          </details>
        </article>

        <article className="card card--gate">
          <header className="card__head"><h2 className="card__title"><Icon name="qr-code" />Gate check-in</h2><span className="card__tag">Event day</span></header>
          <div className="gate" data-state="ready">
            <div className="gate__ready">
              <div className="gate__finder"><i /><i /><i /><i /><Icon name="qr-code" className="gate__qr" /><span className="gate__line" /></div>
              <p>Point the camera at the QR code</p>
            </div>
          </div>
          <p className="card__foot card__foot--plain">The scanner opens here when ticket sales start. Each code works once.</p>
        </article>

        <article className="card card--guests">
          <header className="card__head"><h2 className="card__title"><Icon name="users" />Guest list</h2><span className="card__tag">{sold} {sold === 1 ? "guest" : "guests"}</span></header>
          {guests.length > 0 ? (
            <ul className="guests">
              {guests.map((g, i) => (
                <li key={i}>
                  <span className="av">{initials(g.name)}</span>
                  <span><b>{g.name}</b><small>{g.ticket}</small></span>
                  {g.in ? <span className="ok"><Icon name="check-circle" />In</span> : <span className="wait"><Icon name="clock" />Not yet</span>}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="guests">
              <li className="guests__empty"><span className="av"><Icon name="users" /></span><span><b>No guests yet</b><small>Guests show up here as they get tickets.</small></span></li>
            </ul>
          )}
          <div className="meter"><i style={{ "--p": total ? checkedIn / total : 0 } as CSSProperties} /></div>
          <p className="card__foot card__foot--plain"><span>{checkedIn}</span>&nbsp;of {total} checked in</p>
        </article>

        <article className="card card--payout">
          <header className="card__head"><h2 className="card__title"><Icon name="wallet" />Payouts</h2><span className="card__tag">{hasPaid ? "5% + ₦100" : "Free"}</span></header>
          <div className="payout">
            <div className="bank">
              <span className="bank__chip"><GanorSymbol /></span>
              <p className="bank__label">Paid to your bank</p>
              <p className="bank__amount">{naira(earned)}</p>
              <p className="bank__acct">Add your bank when payments open</p>
            </div>
            <ul className="ledger">
              {tickets.length > 0 ? (
                tickets.map((t) => <li key={t.id}><span>{t.name} × {t.sold}</span><b>{naira(takeHome(t.price_kobo) * t.sold)}</b></li>)
              ) : (
                <li><span>No tickets yet</span><b>₦0</b></li>
              )}
            </ul>
          </div>
        </article>

        <article className="card card--fee">
          <header className="card__head"><h2 className="card__title"><Icon name="percent" />Ganor fee</h2><span className="card__tag">5% + ₦100</span></header>
          <FeeSeg eventId={ev.id} mode={absorb ? "absorb" : "buyer"} />
        </article>

        <article className="card card--share">
          <header className="card__head"><h2 className="card__title"><Icon name="share" />Share</h2><span className="card__tag">{live ? "Live" : "After publish"}</span></header>
          {live ? (
            <ShareButtons url={publicUrl} title={ev.title} text={`${ev.title} · ${when} · ${ev.venue_name}, ${ev.city}. Get your ticket on Ganor:`} />
          ) : (
            <p className="card__empty">Publish to get your event link and share it on WhatsApp, X, Facebook and LinkedIn.{tickets.length === 0 ? " Add a ticket type first." : ""}</p>
          )}
        </article>

        <article className="card card--banner">
          <header className="card__head"><h2 className="card__title"><Icon name="image" />Event banner</h2><span className="card__tag">2 : 1</span></header>
          <ImageUpload
            bucket="event-banners"
            userId={userId}
            current={ev.cover_url}
            save={saveEventBanner.bind(null, ev.id)}
            shape="banner"
            label="Event banner"
            hint="Shown at the top of your event page and when the link is shared. Best at 1600 × 800 px. JPG, PNG or WebP, up to 5 MB."
          />
        </article>

        <article className="card card--details">
          <header className="card__head"><h2 className="card__title"><Icon name="pen" />Event details</h2></header>
          <EventForm
            mode="edit"
            initial={{
              id: ev.id,
              title: ev.title,
              category: ev.category,
              city: ev.city,
              venue_name: ev.venue_name,
              venue_address: ev.venue_address,
              starts_at: isoToLagosLocal(ev.starts_at),
              ends_at: isoToLagosLocal(ev.ends_at),
              description: ev.description,
              halal_friendly: ev.halal_friendly,
            }}
          />
          {ev.status === "draft" && (
            <form action={deleteDraft} className="actions" style={{ justifyContent: "flex-end", borderTop: "1px solid var(--ganor-line)", paddingTop: 16 }}>
              <input type="hidden" name="id" value={ev.id} />
              <SubmitButton variant="danger" size="sm" arrow={false} pendingText="Deleting">Delete draft</SubmitButton>
            </form>
          )}
        </article>
      </div>
      <Reveal />
    </div>
  )
}
