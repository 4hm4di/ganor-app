import { RsvpBuilder } from "./RsvpBuilder"
import { parseRsvpFields } from "@/lib/rsvp"
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
import { BarChart } from "@/components/widgets/BarChart"
import { SalesTrend } from "@/components/widgets/SalesTrend"
import { CountUp } from "@/components/widgets/CountUp"
import { planById, questionLimit, naira as nairaWhole } from "@/lib/plans"
import { PhasePill } from "@/components/PhasePill"
import { BackLink } from "@/components/BackLink"
import { eventPhase, PHASE_LABEL, feeKobo, formatDate, formatNaira, formatTime, isoToLagosLocal } from "@/lib/ganor"


const ERRORS: Record<string, string> = {
  tickets: "Add at least one ticket type before you publish.",
  plan: "Pay for this event's RSVP plan before you publish. Payment details are in the Plan card below.",
  past: "This event's start time has passed. Change the date before you publish.",
  notfound: "We couldn't find that event.",
}

const naira = (k: number) => (k > 0 ? formatNaira(k) : "₦0")
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("")

export type ToolsEvent = EventRow & { ticket_types: TicketTypeRow[] }

export type ToolsGuest = { name: string; ticket: string; in: boolean }

const dayLabel = (d: string) => formatDate(`${d}T12:00:00Z`, { day: "numeric", month: "short" })
const hourLabel = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`

export function EventToolsView({ ev, userId, publicUrl, sp, guests, daily, scanHours, daysLeft }: { ev: ToolsEvent; userId: string; publicUrl: string; sp: { created?: string; published?: string; error?: string }; guests: ToolsGuest[]; daily: { day: string; count: number }[]; scanHours: { hour: number; count: number }[]; daysLeft: number }) {
  const hasFree = ev.ticket_types.some((t) => t.price_kobo === 0)
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

  const freeOnly = tickets.length > 0 && tickets.every((t) => t.price_kobo === 0)
  const fortnight = daily.reduce((n, d) => n + d.count, 0)
  const checkedIn = guests.filter((g) => g.in).length
  const phase = eventPhase(ev, tickets)
  const over = phase === "ended" || phase === "cancelled"

  return (
    <div className="wrap">
      <div className="pagehead">
        <div>
          <BackLink href="/dashboard/events" label="My events" />
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

      {sp.created && <div className="alert alert--ok" role="status" style={{ marginBottom: 14 }}><Icon name="check-circle" /><span>{sp.created === "rsvp" ? "Free event created as a draft. Choose your RSVP questions below, add a banner, then publish." : "Event created as a draft. Add a banner and your ticket types, then publish."}</span></div>}
      {sp.published && <div className="alert alert--ok" role="status" style={{ marginBottom: 14 }}><Icon name="check-circle" /><span>Your event is live. Share the link below.</span></div>}
      {sp.error && <div className="alert alert--error" role="alert" style={{ marginBottom: 14 }}><Icon name="warning" /><span>{ERRORS[sp.error] ?? "Something went wrong."}</span></div>}

      <div className="bento">
        <article className="card card--sales" data-reveal>
          <header className="card__head"><h2 className="card__title"><Icon name="receipt" />{freeOnly ? "RSVPs" : "Tickets sold"}</h2><span className="card__tag">{PHASE_LABEL[phase]}</span></header>
          <p className="card__big"><CountUp value={sold} /><small> of {total.toLocaleString("en-NG")}</small></p>
          <SalesTrend days={daily.map((d) => ({ day: d.day, label: dayLabel(d.day), count: d.count }))} total={sold} capacity={total} daysLeft={daysLeft} unit={freeOnly ? "RSVPs" : "sold"} />
          <p className="small muted" style={{ marginTop: 6 }}>{fortnight} in the last 14 days{daysLeft > 0 ? ` · ${daysLeft} day${daysLeft === 1 ? "" : "s"} to go` : ""}. The dashed line is a projection from the last 7 days.</p>
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
          {scanHours.length > 0 ? (
            <>
              <p className="card__big"><CountUp value={checkedIn} /><small> of {guests.length} in</small></p>
              <BarChart points={scanHours.map((h) => ({ label: hourLabel(h.hour), sub: `${hourLabel(h.hour)}–${hourLabel((h.hour + 1) % 24)}`, value: h.count }))} unit="scanned in" color="var(--ganor-success)" />
            </>
          ) : (
            <div className="gatebox">
              <div className="gatebox__finder" aria-hidden="true"><i /><i /><i /><i /><Icon name="qr-code" size={44} /></div>
              <p><b>Scan tickets with any phone.</b> Each code works once, so no copies get in.</p>
            </div>
          )}
          <div className="actions" style={{ gap: 8 }}>
            <Link href={`/gate/${ev.id}`} className="btn btn--primary btn--sm">
              <span>Open scanner</span>
              <span className="btn__arrow" aria-hidden="true"><Icon name="qr-code" /></span>
            </Link>
            <Link href="/dashboard/team" className="btn btn--ghost btn--sm btn--plain">Gate team</Link>
          </div>
          <p className="card__empty">Scan on your phone, or add gate accounts so your team can scan with their own username and password.</p>
        </article>

        {ev.event_kind === "rsvp" && (() => {
          const p = planById(ev.rsvp_plan)
          const free = p.price === 0
          const paid = free || ev.plan_paid_at !== null
          return (
            <article className={`card planc${paid ? " planc--paid" : ""}`} data-reveal style={{ gridColumn: "1 / -1" }} id="plan">
              <header className="card__head"><h2 className="card__title"><Icon name="wallet" />{p.name} plan</h2><span className={`badge ${paid ? "badge--ok" : "badge--warn"}`}>{free ? "No payment needed" : paid ? "Paid" : "Payment due before publishing"}</span></header>
              <div className="planc__row">
                <p className="card__big">{nairaWhole(p.price)}<small>{free ? " up to 30 guests" : " one-off for this event"}</small></p>
                <ul className="planc__perks">{p.perks.map((k) => <li key={k}><Icon name="check-circle" size={16} />{k}</li>)}</ul>
              </div>
              {free && <p className="small muted">Need more than 30 guests? Plans start at ₦50,000 per event (Basic, 200 guests). Email <a href={`mailto:support@ganor.ng?subject=${encodeURIComponent(`Upgrade RSVP plan · ${ev.title} · ${ev.id.slice(0, 8).toUpperCase()}`)}`}>support@ganor.ng</a> to upgrade before your list fills up.</p>}
              {!paid && (
                <p className="small muted">Online payment is being set up. For now, pay by bank transfer: email <a href={`mailto:support@ganor.ng?subject=${encodeURIComponent(`RSVP plan ${p.name} · ${ev.title} · ${ev.id.slice(0, 8).toUpperCase()}`)}`}>support@ganor.ng</a> with reference <b>{ev.id.slice(0, 8).toUpperCase()}</b>. Ganor confirms it and the Publish button works straight away.</p>
              )}
            </article>
          )
        })()}

        <article className="card" data-reveal style={{ gridColumn: "1 / -1" }} id="rsvp">
          <header className="card__head"><h2 className="card__title"><Icon name="doc" />RSVP form</h2><span className="card__tag">{hasFree ? `${planById(ev.rsvp_plan).name} plan · up to ${planById(ev.rsvp_plan).cap.toLocaleString("en-NG")} guests` : "For free tickets"}</span></header>
          {hasFree ? <RsvpBuilder eventId={ev.id} initial={parseRsvpFields(ev.rsvp_fields)} max={questionLimit(ev.rsvp_plan)} /> : <p className="card__empty">Add a free ticket type (price ₦0) and guests can RSVP on your event page. You choose a few short questions here.</p>}
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

        {/* Free RSVP events take no money, so no payout card and no bank details. */}
        {ev.event_kind !== "rsvp" && <article className="card card--payout" data-reveal>
          <header className="card__head"><h2 className="card__title"><Icon name="wallet" />Payouts</h2><span className="card__tag">{hasPaid ? "5% + ₦100" : "Free"}</span></header>
          {hasPaid && (
            <div className="fee-row fee-row--top">
              <span className="field__label">Who pays the Ganor fee <small>(5% + ₦100 per paid ticket)</small></span>
              <FeeSeg eventId={ev.id} mode={absorb ? "absorb" : "buyer"} />
            </div>
          )}
          <div className="payout">
            <div className="bank">
              <span className="bank__chip"><GanorSymbol /></span>
              <p className="bank__label">Paid to your bank</p>
              <p className="bank__amount"><CountUp value={Math.round(earned / 100)} prefix="₦" /></p>
              <p className="bank__acct"><Link href="/dashboard/profile#payouts">Your payout account</Link></p>
            </div>
            <ul className="ledger">
              {tickets.length > 0 ? (
                tickets.map((t) => <li key={t.id}><span>{t.name} × {t.sold}</span><b>{naira(takeHome(t.price_kobo) * t.sold)}</b></li>)
              ) : (
                <li><span>No tickets yet</span><b>₦0</b></li>
              )}
            </ul>
          </div>
        </article>}

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

