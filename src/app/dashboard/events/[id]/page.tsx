import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import { getUserId } from "@/lib/supabase/server"
import { EventForm } from "../../EventForm"
import { TicketForm } from "../../TicketForm"
import { deleteDraft, deleteTicketType, setEventStatus } from "../../actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"
import { formatDate, formatNaira, formatTime, isoToLagosLocal } from "@/lib/ganor"

export const metadata: Metadata = { title: "Edit event" }

const ERRORS: Record<string, string> = {
  tickets: "Add at least one ticket type before you publish.",
  past: "This event's start time has passed. Change the date before you publish.",
  notfound: "We couldn't find that event.",
}

export default async function EditEvent({
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

  const tickets = ev.ticket_types ?? []
  const live = ev.status === "published"
  const publicPath = `/e/${ev.slug}`
  const host = (await headers()).get("host") ?? "app.ganor.ng"

  return (
    <div className="wrap--narrow">
      <div className="pagehead">
        <div>
          <Link href="/dashboard" className="crumb"><Icon name="arrow-right" size={16} />My events</Link>
          <div className="actions" style={{ gap: 10 }}>
            <span className={`pill pill--${ev.status}`}>{live ? "Live" : ev.status === "draft" ? "Draft" : "Cancelled"}</span>
            {ev.halal_friendly && <span className="pill pill--halal"><Icon name="halal" size={14} />Halal-friendly</span>}
          </div>
          <h1 style={{ marginTop: 10 }}>{ev.title}</h1>
          <p className="muted">{formatDate(ev.starts_at)} · {formatTime(ev.starts_at)} · {ev.venue_name}, {ev.city}</p>
        </div>
      </div>

      <div className="stack">
        {sp.created && <div className="alert alert--ok" role="status"><Icon name="check-circle" /><span>Event created as a draft. Add your ticket types below, then publish.</span></div>}
        {sp.published && <div className="alert alert--ok" role="status"><Icon name="check-circle" /><span>Your event is live. Share the link: <a href={publicPath}>{`${host}${publicPath}`}</a></span></div>}
        {sp.error && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{ERRORS[sp.error] ?? "Something went wrong."}</span></div>}

        {/* Publish bar */}
        <div className="card">
          <div className="actions" style={{ justifyContent: "space-between" }}>
            <div>
              <h2 className="section-t">{live ? "Your event is live" : "Ready to go live?"}</h2>
              <p className="small muted" style={{ marginTop: 4 }}>
                {live ? "Anyone with the link can see it. Ticket checkout opens with payments." : "Publishing makes the event page public. You can unpublish any time."}
              </p>
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
        </div>

        {/* Tickets */}
        <div className="card stack">
          <div>
            <span className="kicker"><Icon name="ticket" size={18} />Tickets</span>
            <h2 className="section-t" style={{ marginTop: 8 }}>Ticket types</h2>
          </div>
          {tickets.length > 0 && (
            <div className="tt">
              {tickets.map((t) => (
                <div className="tt__row" key={t.id}>
                  <div>
                    <div className="tt__name">{t.name}</div>
                    <div className="tt__meta">
                      {t.sold} of {t.quantity} sold · up to {t.max_per_order} per order{t.description ? ` · ${t.description}` : ""}
                    </div>
                  </div>
                  <div className="actions" style={{ gap: 14 }}>
                    <span className="tt__price">{formatNaira(t.price_kobo)}</span>
                    {t.sold === 0 && (
                      <form action={deleteTicketType}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="event_id" value={ev.id} />
                        <SubmitButton variant="ghost" size="xs" arrow={false} pendingText="…">Remove</SubmitButton>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <TicketForm eventId={ev.id} first={tickets.length === 0} />
        </div>

        {/* Details */}
        <div className="card stack">
          <div>
            <span className="kicker"><Icon name="pen" size={18} />Details</span>
            <h2 className="section-t" style={{ marginTop: 8 }}>Event details</h2>
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
        </div>

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
