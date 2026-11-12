import type { Metadata } from "next"
import Link from "next/link"
import { getUserId } from "@/lib/supabase/server"
import { formatDate, formatTime } from "@/lib/ganor"
import { setEventStatus } from "../actions"

export const metadata: Metadata = { title: "Events · Admin", robots: { index: false } }

export default async function AdminEvents({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "published", q = "" } = await searchParams
  const { supabase } = await getUserId()
  let query = supabase
    .from("events")
    .select("id, title, slug, city, starts_at, status, created_at, profiles(display_name), ticket_types(quantity, sold)")
    .order("starts_at", { ascending: false })
    .limit(200)
  if (status !== "all") query = query.eq("status", status)
  if (q.trim()) query = query.ilike("title", `%${q.trim()}%`)
  const { data: events } = await query
  return (
    <div className="stack">
      <h1>Events</h1>
      <form className="afilter" role="search">
        <input name="q" defaultValue={q} placeholder="Search title…" aria-label="Search events" autoComplete="off" />
        <select name="status" defaultValue={status} aria-label="Status">
          <option value="published">Live</option>
          <option value="draft">Drafts</option>
          <option value="cancelled">Cancelled</option>
          <option value="all">All</option>
        </select>
        <button className="btn btn--primary btn--sm btn--plain">Filter</button>
      </form>
      <p className="small muted">{events?.length ?? 0} events</p>
      <div className="alist">
        {(events ?? []).map((e) => {
          const sold = e.ticket_types.reduce((n, t) => n + t.sold, 0)
          const total = e.ticket_types.reduce((n, t) => n + t.quantity, 0)
          return (
            <article key={e.id} className="card arow">
              <div className="arow__main">
                <b>{e.title} <span className={`pill pill--${e.status}`}>{e.status === "published" ? "Live" : e.status === "draft" ? "Draft" : "Cancelled"}</span></b>
                <small>{formatDate(e.starts_at)} · {formatTime(e.starts_at)} · {e.city} · by {(e.profiles as unknown as { display_name: string } | null)?.display_name}</small>
                <small>{sold} of {total} tickets sold · <Link href={`/e/${e.slug}`}>public page</Link></small>
              </div>
              <form action={setEventStatus} className="arow__side actions" style={{ gap: 6 }}>
                <input type="hidden" name="event_id" value={e.id} />
                {e.status === "published" && <button className="btn btn--ghost btn--xs btn--plain" name="status" value="draft">Unpublish</button>}
                {e.status !== "cancelled" && <button className="btn btn--danger btn--xs btn--plain" name="status" value="cancelled">Cancel event</button>}
                {e.status !== "published" && <button className="btn btn--ghost btn--xs btn--plain" name="status" value="published">Publish</button>}
              </form>
            </article>
          )
        })}
      </div>
    </div>
  )
}
