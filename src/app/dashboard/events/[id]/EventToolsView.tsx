import type { CSSProperties } from "react"
import type { EventRow, TicketTypeRow } from "@/lib/database.types"
import Link from "next/link"
import { EventForm } from "../../EventForm"
import { TicketForm } from "../../TicketForm"
import { TicketRow } from "../../TicketRow"
import { FeeSeg } from "../../FeeSeg"
import { deleteDraft, saveEventBanner, setEventStatus } from "../../actions"
import { SubmitButton } from "@/components/SubmitButton"
import { ConfirmButton } from "@/components/ConfirmButton"
import { ImageUpload } from "@/components/ImageUpload"
import { ShareButtons } from "@/components/ShareButtons"
import { GanorSymbol } from "@/components/Loader"
import { Icon } from "@/components/Icon"
import { PhasePill } from "@/components/PhasePill"
import { BackLink } from "@/components/BackLink"
import { eventPhase, PHASE_LABEL, feeKobo, formatDate, formatNaira, formatTime, isoToLagosLocal } from "@/lib/ganor"


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

export type ToolsEvent = EventRow & { ticket_types: TicketTypeRow[] }

export type ToolsGuest = { name: string; ticket: string; in: boolean }

export function EventToolsView({ ev, userId, publicUrl, sp, guests }: { ev: ToolsEvent; userId: string; publicUrl: string; sp: { created?: string; published?: string; error?: string }; guests: ToolsGuest[] }) {
  const publicPath = `/e/${ev.slug}`
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
  const checkedIn = guests.filter((g) => g.in).length
  const phase = eventPhase(ev, tickets)
  const over = phase === "ended" || phase === "cancelled"

  return (
    <div className="wrap">
      <div className="pagehead">
        <div>
          <BackLink href="/dashboard" label="My events" />
          <div className="actions" style={{ gap: 8 }}>
            <PhasePill phase={phase} />
            {ev.halal_friendly && <span className="pill pill--halal"><Icon name="halal" size={14} />Halal-friendly</span>}
          </div>
          <h1 style={{ marginTop: 10 }}>{ev.title}</h1>
          <p className="muted">{when} · {ev.venue_name}, {ev.city}</p>
        </div>
        <div className="actions">
          <Link href={publicPath} className="btn btn--ghost btn--sm btn--plain" target="_blank">{live ? "View page" : "Preview"}</Link>
          {!over && (
            <form action={setEventStatus}>
              <input type="hidden" name="id" value={ev.id} />
              {live ? (
                <SubmitButton name="to" value="draft" variant="outline" size="sm" arrow={false} pendingText="Unpublishing…">Unpublish</SubmitButton>
              ) : (
                <SubmitButton name="to" value="published" size="sm" pendingText="Publishing…">Publish</SubmitButton>
              )}
            </form>
          )}
        </div>
      </div>

      {sp.created && <div className="alert alert--ok" role="status" style={{ marginBottom: 14 }}><Icon name="check-circle" /><span>Event created as a draft. Add a banner and your ticket types, then publish.</span></div>}
      {sp.published && <div className="alert alert--ok" role="status" style={{ marginBottom: 14 }}><Icon name="check-circle" /><span>Your event is live. Share the link below.</span></div>}
      {sp.error && <div className="alert alert--error" role="alert" style={{ marginBottom: 14 }}><Icon name="warning" /><span>{ERRORS[sp.error] ?? "Something went wrong."}</span></div>}

      <div className="bento">
        <article className="card card--sales" data-reveal>
          <header className="card__head"><h2 className="card__title"><Icon name="receipt" />Tickets sold</h2><span className="card__tag">{PHASE_LABEL[phase]}</span></header>
          <p className="card__big" style={{ fontVariantNumeric: "tabular-nums" }}><span>{sold}</span><small> of {total}</small></p>
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

        <article className="card card--types" data-reveal>
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

        <article className="card card--gate" data-reveal>
          <header className="card__head"><h2 className="card__title"><Icon name="qr-code" />Gate check-in</h2><span className="card__tag">Event day</span></header>
          <div className="gatebox">
            <div className="gatebox__finder" aria-hidden="true"><i /><i /><i /><i /><Icon name="qr-code" size={44} /></div>
            <p><b>Scan tickets with any phone.</b> Each code works once, so no copies get in.</p>
          </div>
          <div className="actions" style={{ gap: 8 }}>
            <Link href={`/gate/${ev.id}`} className="btn btn--primary btn--sm">
              <span>Open scanner</span>
              <span className="btn__arrow" aria-hidden="true"><Icon name="qr-code" /></span>
            </Link>
            <Link href="/dashboard/team" className="btn btn--ghost btn--sm btn--plain">Gate team</Link>
          </div>
          <p className="card__empty">Scan on your phone, or add gate accounts so your team can scan with their own username and password.</p>
        </article>

        <article className="card card--guests" data-reveal>
          <header className="card__head"><h2 className="card__title"><Icon name="users" />Guest list</h2><span className="card__tag">{sold} {sold === 1 ? "guest" : "guests"}</span></header>
          {guests.length > 0 ? (
            <ul className="guests">
              {guests.slice(0, 5).map((g, i) => (
                <li key={i}>
                  <span className="av">{initials(g.name)}</span>
                  <span><b>{g.name}</b><small>{g.ticket}</small></span>
                  {g.in ? <span className="ok"><Icon name="check-circle" />In</span> : <span className="wait"><Icon name="clock" />Not yet</span>}
                </li>
              ))}
              {guests.length > 5 && <li className="guests__more"><span /><span><small>+ {guests.length - 5} more in the download</small></span></li>}
            </ul>
          ) : (
            <ul className="guests">
              <li className="guests__empty"><span className="av"><Icon name="users" /></span><span><b>No guests yet</b><small>Guests show up here as they get tickets.</small></span></li>
            </ul>
          )}
          <div className="meter"><i style={{ "--p": guests.length ? checkedIn / guests.length : 0 } as CSSProperties} /></div>
          <p className="card__foot card__foot--plain"><span>{checkedIn}</span>&nbsp;of {guests.length} checked in</p>
          <div className="dl">
            <a className="dl__btn" href={`/dashboard/events/${ev.id}/guests?format=pdf`} download>
              <Icon name="doc" size={18} /><span><b>Guest list PDF</b><small>Ganor branded, ready to print</small></span>
            </a>
            <a className="dl__btn" href={`/dashboard/events/${ev.id}/guests?format=csv`} download>
              <Icon name="receipt" size={18} /><span><b>Spreadsheet</b><small>CSV for Excel or Sheets</small></span>
            </a>
          </div>
        </article>

        <article className="card card--payout" data-reveal>
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

        <article className="card card--share" data-reveal>
          <header className="card__head"><h2 className="card__title"><Icon name="share" />Share</h2><span className="card__tag">{live ? "Live" : "After publish"}</span></header>
          {live ? (
            <ShareButtons url={publicUrl} title={ev.title} text={`${ev.title} · ${when} · ${ev.venue_name}, ${ev.city}. Get your ticket on Ganor:`} />
          ) : (
            <p className="card__empty">Publish to get your event link and share it on WhatsApp, X, Facebook and LinkedIn.{tickets.length === 0 ? " Add a ticket type first." : ""}</p>
          )}
        </article>

        <article className="card card--banner" data-reveal>
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

        <article className="card card--details" data-reveal>
          <header className="card__head"><h2 className="card__title"><Icon name="pen" />Event details</h2></header>
          <div className="fee-row">
            <span className="field__label">Who pays the Ganor fee <small>(5% + ₦100 per paid ticket)</small></span>
            <FeeSeg eventId={ev.id} mode={absorb ? "absorb" : "buyer"} />
          </div>
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
              <ConfirmButton confirmText="Tap again to delete" pendingText="Deleting…">Delete draft</ConfirmButton>
            </form>
          )}
        </article>
      </div>
    </div>
  )
}

