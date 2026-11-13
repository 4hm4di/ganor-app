import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { Icon } from "@/components/Icon"
import { eventPhase, formatDate, formatNaira, formatTime, type EventPhase } from "@/lib/ganor"
import { PhasePill } from "@/components/PhasePill"

export const metadata: Metadata = { title: "My events" }

const STATUS: { value: string; label: string; match: (p: EventPhase) => boolean }[] = [
  { value: "all", label: "All", match: () => true },
  { value: "live", label: "Happening now", match: (p) => p === "live" },
  { value: "upcoming", label: "Upcoming", match: (p) => p === "upcoming" || p === "soldout" },
  { value: "draft", label: "Drafts", match: (p) => p === "draft" },
  { value: "ended", label: "Past", match: (p) => p === "ended" },
  { value: "cancelled", label: "Cancelled", match: (p) => p === "cancelled" },
]
const WHEN = [
  { value: "any", label: "Any date" },
  { value: "next30", label: "Next 30 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "last90", label: "Last 90 days" },
  { value: "year", label: "This year" },
  { value: "lastyear", label: "Last year" },
]
const SORT = [
  { value: "soon", label: "Date: soonest first" },
  { value: "recent", label: "Date: newest first" },
  { value: "sold", label: "Most tickets" },
  { value: "title", label: "Title A–Z" },
]

function inWindow(iso: string, when: string, now: number) {
  const t = new Date(iso).getTime()
  const day = 86_400_000
  const y = new Date(now).getUTCFullYear()
  switch (when) {
    case "next30": return t >= now && t <= now + 30 * day
    case "last30": return t <= now && t >= now - 30 * day
    case "last90": return t <= now && t >= now - 90 * day
    case "year": return new Date(iso).getUTCFullYear() === y
    case "lastyear": return new Date(iso).getUTCFullYear() === y - 1
    default: return true
  }
}
const clock = () => Date.now()

export default async function MyEvents({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; when?: string; sort?: string; city?: string }> }) {
  const sp = await searchParams
  const q = (sp.q ?? "").trim()
  const status = STATUS.some((s) => s.value === sp.status) ? sp.status! : "all"
  const when = WHEN.some((w) => w.value === sp.when) ? sp.when! : "any"
  const sort = SORT.some((s) => s.value === sp.sort) ? sp.sort! : "soon"
  const city = sp.city ?? ""

  const { supabase, userId } = await getUserId()
  if (!userId) redirect("/login")

  const { data: events } = await supabase
    .from("events")
    .select("id, title, city, venue_name, starts_at, ends_at, status, cover_url, ticket_types(quantity, sold, on_sale, price_kobo)")
    .eq("host_id", userId)
    .order("starts_at", { ascending: true })

  const now = clock()
  const all = (events ?? []).map((e) => {
    const sold = e.ticket_types.reduce((n, t) => n + t.sold, 0)
    const total = e.ticket_types.reduce((n, t) => n + t.quantity, 0)
    const gross = e.ticket_types.reduce((n, t) => n + t.sold * t.price_kobo, 0)
    const free = e.ticket_types.length > 0 && e.ticket_types.every((t) => t.price_kobo === 0)
    return { e, phase: eventPhase(e, e.ticket_types) as EventPhase, sold, total, gross, free }
  })
  const cities = [...new Set(all.map((x) => x.e.city))].sort()
  const needle = q.toLowerCase()
  const base = all.filter((x) =>
    (!needle || x.e.title.toLowerCase().includes(needle) || x.e.venue_name.toLowerCase().includes(needle)) &&
    (!city || x.e.city === city) && inWindow(x.e.starts_at, when, now))
  const statusDef = STATUS.find((s) => s.value === status)!
  const shown = base.filter((x) => statusDef.match(x.phase)).sort((a, b) => {
    if (sort === "recent") return b.e.starts_at.localeCompare(a.e.starts_at)
    if (sort === "sold") return b.sold - a.sold
    if (sort === "title") return a.e.title.localeCompare(b.e.title)
    // soonest: live and upcoming first by date, then the past newest-first
    const pa = a.phase === "ended" || a.phase === "cancelled", pb = b.phase === "ended" || b.phase === "cancelled"
    if (pa !== pb) return pa ? 1 : -1
    return pa ? b.e.starts_at.localeCompare(a.e.starts_at) : a.e.starts_at.localeCompare(b.e.starts_at)
  })
  const filtered = Boolean(q || city || when !== "any" || sort !== "soon")
  const href = (s: string) => {
    const u = new URLSearchParams()
    if (q) u.set("q", q)
    if (s !== "all") u.set("status", s)
    if (when !== "any") u.set("when", when)
    if (sort !== "soon") u.set("sort", sort)
    if (city) u.set("city", city)
    const str = u.toString()
    return `/dashboard/events${str ? `?${str}` : ""}`
  }
  const totals = { tickets: shown.reduce((n, x) => n + x.sold, 0), gross: shown.reduce((n, x) => n + x.gross, 0) }

  return (
    <div className="wrap">
      <div className="pagehead">
        <div>
          <span className="kicker"><Icon name="calendar" size={18} />My events</span>
          <h1 style={{ marginTop: 10 }}>Your events</h1>
          <p className="muted">Everything you&rsquo;ve hosted. Search, filter by date or city, and open an event to manage it.</p>
        </div>
      </div>

      {!all.length ? (
        <div className="card empty">
          <Icon name="ticket" size={48} />
          <h2>No events yet</h2>
          <p>Your first event takes about two minutes. You can keep it as a draft until you&rsquo;re ready.</p>
          <Link href="/dashboard/events/new" className="btn btn--primary">
            <span>Create your first event</span>
            <span className="btn__arrow" aria-hidden="true"><Icon name="arrow" /></span>
          </Link>
        </div>
      ) : (
        <>
          <form className="evfilter" role="search" action="/dashboard/events">
            {status !== "all" && <input type="hidden" name="status" value={status} />}
            <input className="evfilter__q" type="search" name="q" defaultValue={q} placeholder="Search title or venue…" aria-label="Search your events" autoComplete="off" enterKeyHint="search" />
            <select name="when" defaultValue={when} aria-label="Date">
              {WHEN.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
            <select name="city" defaultValue={city} aria-label="City">
              <option value="">All cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select name="sort" defaultValue={sort} aria-label="Sort">
              {SORT.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button className="btn btn--primary btn--sm btn--plain">Apply</button>
          </form>

          <nav className="evstats" aria-label="Status">
            {STATUS.map((s) => (
              <Link key={s.value} href={href(s.value)} className={s.value === status ? "is-on" : ""} aria-current={s.value === status ? "true" : undefined} scroll={false}>
                {s.label} <b>{base.filter((x) => s.match(x.phase)).length}</b>
              </Link>
            ))}
          </nav>

          <p className="small muted" style={{ marginBottom: 10 }}>
            {shown.length} {shown.length === 1 ? "event" : "events"} · {totals.tickets.toLocaleString("en-NG")} tickets{totals.gross ? ` · ${formatNaira(totals.gross)} in sales` : ""}
            {filtered && <> · <Link href="/dashboard/events">Clear filters</Link></>}
          </p>

          {shown.length === 0 ? (
            <div className="card empty" style={{ padding: "40px 24px" }}>
              <Icon name="search" size={40} />
              <h2>Nothing matches</h2>
              <p>Try another word, date range or city.</p>
              <Link href="/dashboard/events" className="btn btn--ghost btn--sm btn--plain">Clear filters</Link>
            </div>
          ) : (
            <div className="evlist">
              {shown.map(({ e, phase, sold, total, gross, free }) => (
                <Link key={e.id} href={`/dashboard/events/${e.id}`} className={`evrow${phase === "ended" || phase === "cancelled" ? " is-past" : ""}`}>
                  <span className={`datebox${e.cover_url ? " datebox--img" : ""}`}>
                    {e.cover_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.cover_url} alt="" width={128} height={64} loading="lazy" />
                    )}
                    <b>{formatDate(e.starts_at, { day: "numeric" })}</b>
                    <span>{formatDate(e.starts_at, { month: "short" })}</span>
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span className="evrow__t">{e.title}</span>
                    <span className="evrow__m" style={{ display: "block" }}>
                      {formatDate(e.starts_at, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · {formatTime(e.starts_at)} · {e.city}
                    </span>
                    <span className="evrow__money" style={{ display: "block" }}>
                      {e.ticket_types.length ? `${sold} of ${total} ${free ? "RSVPs" : "tickets"}${gross ? ` · ${formatNaira(gross)}` : ""}` : "No tickets yet"}
                    </span>
                  </span>
                  <PhasePill phase={phase} />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
