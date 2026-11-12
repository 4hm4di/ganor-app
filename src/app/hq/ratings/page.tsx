import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { Stars } from "@/components/Stars"
import { formatDate } from "@/lib/ganor"
import { CreateLinks, Reissue, StopForm } from "./SendLinks"
import { moderateReview } from "./actions"

export const metadata: Metadata = { title: { absolute: "Ganor" }, robots: { index: false } }

function lastSixtyDays() {
  const t = Date.now()
  return { since: new Date(t - 60 * 86_400_000).toISOString(), now: new Date(t).toISOString() }
}

// Ganor staff only: send rating links after events, honour STOP replies, handle reported reviews.
export default async function StaffRatings() {
  const { supabase, userId } = await getUserId()
  if (!userId) notFound()

  const { since, now } = lastSixtyDays()
  const [{ data: events }, { data: orders }, { data: invites }, { data: reports }] = await Promise.all([
    supabase.from("events").select("id, title, slug, starts_at, ends_at, profiles(display_name)").eq("status", "published").lt("starts_at", now).gte("starts_at", since).order("starts_at", { ascending: false }),
    supabase.from("orders").select("id, event_id, status, total_kobo, rating_consent").eq("status", "paid"),
    supabase.from("review_invites").select("id, event_id, order_id, attended, sent_at, expires_at, revoked_at, orders(buyer_name, buyer_phone)").order("created_at", { ascending: false }),
    supabase.from("review_reports").select("id, reason, created_at, review_id, event_reviews(id, rating, comment, display_name, status)").is("resolved_at", null).order("created_at"),
  ])
  const { data: reviewed } = await supabase.from("event_reviews").select("id, event_id")
  const ended = (events ?? []).filter((e) => new Date(e.ends_at ?? e.starts_at) < new Date())

  return (
    <div>
      <div className="stack">
        <h1>Ratings</h1>
        <section className="card stack" aria-labelledby="send-h">
          <h2 id="send-h">Send rating requests</h2>
          <p className="small muted">Only paid orders that ticked the rating box at checkout get a link, one per WhatsApp number per event. Links work for 14 days. Send once, about 2 hours after the event ends (or 10:00 the next morning for late events).</p>
          {ended.length === 0 && <p className="muted">No published events have ended in the last 60 days.</p>}
          {ended.map((e) => {
            const evOrders = (orders ?? []).filter((o) => o.event_id === e.id && o.total_kobo > 0)
            const evInvites = (invites ?? []).filter((i) => i.event_id === e.id)
            const evReviews = (reviewed ?? []).filter((r) => r.event_id === e.id).length
            const host = (e.profiles as unknown as { display_name: string } | null)?.display_name
            return (
              <article key={e.id} className="staffev">
                <header>
                  <div>
                    <b>{e.title}</b>
                    <small>{formatDate(e.starts_at)} · {host} · <Link href={`/e/${e.slug}`}>event page</Link></small>
                  </div>
                  <p className="small muted">{evOrders.length} paid orders · {evOrders.filter((o) => o.rating_consent).length} agreed · {evInvites.length} links · {evReviews} ratings</p>
                </header>
                <CreateLinks eventId={e.id} />
                {evInvites.length > 0 && (
                  <details>
                    <summary className="small">Links already created ({evInvites.length})</summary>
                    <ul className="sendlist">
                      {evInvites.map((i) => {
                        const o = i.orders as unknown as { buyer_name: string; buyer_phone: string } | null
                        const state = i.revoked_at ? "switched off" : new Date(i.expires_at) < new Date() ? "expired" : `open until ${formatDate(i.expires_at)}`
                        return (
                          <li key={i.id}>
                            <span><b>{o?.buyer_name}</b><small>{o?.buyer_phone} · {i.attended ? "scanned" : "not scanned"} · {state}</small></span>
                            {!i.revoked_at && new Date(i.expires_at) > new Date() && <Reissue inviteId={i.id} />}
                          </li>
                        )
                      })}
                    </ul>
                  </details>
                )}
              </article>
            )
          })}
        </section>

        <section className="card stack" aria-labelledby="stop-h">
          <h2 id="stop-h">STOP replies</h2>
          <p className="small muted">When someone replies STOP on WhatsApp, add their number here the same day. Their open rating links stop working and they won&rsquo;t be invited again.</p>
          <StopForm />
        </section>

        <section className="card stack" aria-labelledby="rep-h">
          <h2 id="rep-h">Reported reviews</h2>
          <p className="small muted">Aim to decide within 24 hours. Hide reviews that are abusive, false, off-topic or reveal personal details. Bad but honest reviews stay up.</p>
          {(reports ?? []).length === 0 && <p className="muted">Nothing reported.</p>}
          <ul className="sendlist">
            {(reports ?? []).map((r) => {
              const rv = r.event_reviews as unknown as { id: string; rating: number; comment: string; display_name: string; status: string } | null
              return (
                <li key={r.id}>
                  <span>
                    {rv && <span className="actions" style={{ gap: 8 }}><Stars value={rv.rating} size={14} /><small>{rv.display_name} · {rv.status}</small></span>}
                    <b style={{ fontWeight: 500 }}>{rv?.comment || "(no comment)"}</b>
                    <small>Report: {r.reason} · {formatDate(r.created_at)}</small>
                  </span>
                  <form action={moderateReview} className="actions" style={{ gap: 6 }}>
                    <input type="hidden" name="review_id" value={r.review_id} />
                    <button className="btn btn--danger btn--xs btn--plain" name="status" value="hidden">Hide</button>
                    <button className="btn btn--ghost btn--xs btn--plain" name="status" value="published">Keep</button>
                  </form>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
