import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { EventForm } from "../../EventForm"
import { TicketForm } from "../../TicketForm"
import { TicketRow } from "../../TicketRow"
import { deleteDraft, saveEventBanner, setEventStatus, setFeeMode } from "../../actions"
import { SubmitButton } from "@/components/SubmitButton"
import { ImageUpload } from "@/components/ImageUpload"
import { ShareButtons } from "@/components/ShareButtons"
import { Icon } from "@/components/Icon"
import { feeKobo, formatDate, formatNaira, formatTime, isoToLagosLocal } from "@/lib/ganor"

export const metadata: Metadata = { title: "Event tools" }

const ERRORS: Record<string, string> = {
  tickets: "Add at least one ticket type before you publish.",
  past: "This event's start time has passed. Change the date before you publish.",
  notfound: "We couldn't find that event.",
}

const naira = (k: number) => (k > 0 ? formatNaira(k) : "₦0")

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
  const proto = host.startsWith("localhost") ? "http" : "https"
  const tickets = ev.ticket_types ?? []
  const live = ev.status === "published"
  const publicPath = `/e/${ev.slug}`
  const publicUrl = `${proto}://${host}${publicPath}`

  const total = tickets.reduce((n, t) => n + t.quantity, 0)
  const sold = tickets.reduce((n, t) => n + t.sold, 0)
  const absorb = ev.fee_mode === "absorb"
  const takeHome = (price: number) => (absorb ? Math.max(0, price - feeKobo(price)) : price)
  const earned = tickets.reduce((n, t) => n + takeHome(t.price_kobo) * t.sold, 0)
  const sellOut = tickets.reduce((n, t) => n + takeHome(t.price_kobo) * t.quantity, 0)
  const hasPaid = tickets.some((t) => t.price_kobo > 0)
  const when = `${formatDate(ev.starts_at)} · ${formatTime(ev.starts_at)}`

  return (
    <div className="wrap">
      <div className="pagehead">
        <div>
          <Link href="/dashboard" className="crumb"><Icon name="arrow-right" size={16} />My events</Link>
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
              <SubmitButton name="to" value="draft" variant="outline" size="sm" arrow={false} pendingText="Unpublishing…">Unpublish</SubmitButton>
            ) : (
              <SubmitButton name="to" value="published" size="sm" pendingText="Publishing…">Publish</SubmitButton>
            )}
          </form>
        </div>
      </div>

      <div className="stack">
        {sp.created && <div className="alert alert--ok" role="status"><Icon name="check-circle" /><span>Event created as a draft. Add a banner and your ticket types, then publish.</span></div>}
        {sp.published && <div className="alert alert--ok" role="status"><Icon name="check-circle" /><span>Your event is live. Share the link below.</span></div>}
        {sp.error && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{ERRORS[sp.error] ?? "Something went wrong."}</span></div>}

        <section className="card tool" aria-labelledby="share-h">
          <div className="tool__head">
            <h2 id="share-h" className="tool__title"><Icon name="share" />Share your event</h2>
            <span className="tool__tag">{live ? "Live" : "After you publish"}</span>
          </div>
          {live ? (
            <ShareButtons url={publicUrl} title={ev.title} text={`${ev.title} · ${when} · ${ev.venue_name}, ${ev.city}. Get your ticket on Ganor:`} />
          ) : (
            <p className="small muted">Publish to get your event link and share it on WhatsApp, X, Facebook and LinkedIn.{tickets.length === 0 ? " Add a ticket type first." : ""}</p>
          )}
        </section>

        <section className="card tool" aria-label="Event banner">
          <ImageUpload
            bucket="event-banners"
            userId={userId}
            current={ev.cover_url}
            save={saveEventBanner.bind(null, ev.id)}
            shape="banner"
            label="Event banner"
            hint="Shown at the top of your event page and when the link is shared. Best at 1600 × 800 px. JPG, PNG or WebP, up to 5 MB."
          />
        </section>

        <div className="tools">
          <section className="card tool" aria-labelledby="sold-h">
            <div className="tool__head">
              <h2 id="sold-h" className="tool__title"><Icon name="receipt" />Tickets sold</h2>
              <span className="tool__tag">{live ? "Live" : "Draft"}</span>
            </div>
            <div className="tool__big">{sold}<small>of {total}</small></div>
            <div className="meter" aria-hidden="true"><i style={{ transform: `scaleX(${total ? sold / total : 0})` }} /></div>
            <div className="tool__foot">
              <span>{total ? `${Math.round((sold / total) * 100)}% sold` : "Add a ticket type to start"}</span>
              <span>{total - sold} left</span>
            </div>
            <div className="week" aria-hidden="true">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}><i />{d}</span>)}
            </div>
            <p className="small muted">Daily sales show here once ticket checkout opens.</p>
          </section>

          <section className="card tool" aria-labelledby="types-h">
            <div className="tool__head">
              <h2 id="types-h" className="tool__title"><Icon name="ticket" />Ticket types</h2>
              <span className="tool__tag">{tickets.length} {tickets.length === 1 ? "type" : "types"}</span>
            </div>
            {tickets.length > 0 ? (
              <ul className="trows">{tickets.map((t) => <TicketRow key={t.id} t={t} feeMode={ev.fee_mode} />)}</ul>
            ) : (
              <p className="small muted">No tickets yet. Add your first: Regular, VIP, Student or a free RSVP.</p>
            )}
            <details className="adder" open={tickets.length === 0}>
              <summary><Icon name="add-circle" size={18} />Add ticket type</summary>
              <div className="adder__body"><TicketForm eventId={ev.id} first={tickets.length === 0} /></div>
            </details>
          </section>

          <section className="card tool" aria-labelledby="gate-h">
            <div className="tool__head">
              <h2 id="gate-h" className="tool__title"><Icon name="scan" />Gate check-in</h2>
              <span className="tool__tag">On event day</span>
            </div>
            <div className="gate">
              <div className="gate__finder" aria-hidden="true"><i /><i /><i /><i /><Icon name="qr-code" size={44} /></div>
              <p><b>Scan tickets with any phone.</b> Each code works once, so no copies get in.</p>
            </div>
            <p className="small muted">The scanner opens here when ticket sales start.</p>
          </section>

          <section className="card tool" aria-labelledby="guests-h">
            <div className="tool__head">
              <h2 id="guests-h" className="tool__title"><Icon name="users" />Guest list</h2>
              <span className="tool__tag">0 checked in</span>
            </div>
            <div className="empty-mini">
              <Icon name="users" size={28} />
              <p>Guests appear here as they get tickets, with their ticket type and check-in time.</p>
            </div>
            <div className="meter" aria-hidden="true"><i style={{ transform: "scaleX(0)" }} /></div>
            <div className="tool__foot"><span>0 of {sold} checked in</span><span>{sold} guests</span></div>
          </section>

          <section className="card tool tool--wide" aria-labelledby="pay-h">
            <div className="tool__head">
              <h2 id="pay-h" className="tool__title"><Icon name="wallet" />Payouts</h2>
              <span className="tool__tag">{hasPaid ? "5% + ₦100 per paid ticket" : "Free tickets, no fee"}</span>
            </div>
            <div className="payout">
              <div className="bank">
                <span className="bank__label">Paid to your bank so far</span>
                <span className="bank__amount">{naira(earned)}</span>
                <span className="bank__sub">If you sell out: <b>{naira(sellOut)}</b></span>
                <span className="bank__acct"><Icon name="card" size={16} />Add your bank account when payments open</span>
              </div>
              <div className="stack" style={{ gap: 12 }}>
                <span className="field__label">Who pays the Ganor fee?</span>
                <form action={setFeeMode} className="seg">
                  <input type="hidden" name="id" value={ev.id} />
                  <button type="submit" name="fee_mode" value="buyer" aria-pressed={!absorb}>Buyer pays the fee</button>
                  <button type="submit" name="fee_mode" value="absorb" aria-pressed={absorb}>You absorb the fee</button>
                </form>
                <p className="small muted">
                  {absorb
                    ? "Buyers pay your ticket price. The fee comes out of each paid ticket before payout."
                    : "Your full ticket price comes to you. Buyers see the fee added at checkout."}
                </p>
                {tickets.length > 0 && (
                  <ul className="ledger">
                    {tickets.map((t) => (
                      <li key={t.id}>
                        <span>{t.name} <small>× {t.quantity}</small></span>
                        <b>{naira(takeHome(t.price_kobo) * t.quantity)}</b>
                      </li>
                    ))}
                    <li className="ledger__total"><span>If you sell out</span><b>{naira(sellOut)}</b></li>
                  </ul>
                )}
              </div>
            </div>
          </section>
        </div>

        <section className="card stack" aria-labelledby="details-h">
          <div className="tool__head">
            <h2 id="details-h" className="tool__title"><Icon name="pen" />Event details</h2>
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
        </section>

        {ev.status === "draft" && (
          <form action={deleteDraft} className="actions" style={{ justifyContent: "flex-end" }}>
            <input type="hidden" name="id" value={ev.id} />
            <SubmitButton variant="danger" size="sm" arrow={false} pendingText="Deleting…">Delete draft</SubmitButton>
          </form>
        )}
      </div>
    </div>
  )
}
