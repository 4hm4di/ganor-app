import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Icon } from "@/components/Icon"
import { CATEGORIES, CITIES, eventPhase, formatDate, formatNaira, formatTime } from "@/lib/ganor"
import { PhasePill } from "@/components/PhasePill"

export const metadata: Metadata = {
  title: "Find events",
  description: "Conferences, trade fairs, lectures, campus events and more, happening near you.",
}

type Search = { q?: string; type?: string; city?: string; halal?: string }

export default async function Events({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const q = (sp.q ?? "").trim().slice(0, 80)
  const type = (CATEGORIES as readonly string[]).includes(sp.type ?? "") ? sp.type! : ""
  const city = (CITIES as readonly string[]).includes(sp.city ?? "") ? sp.city! : ""
  const halal = sp.halal === "1"

  const supabase = await createClient()
  let query = supabase
    .from("events")
    .select("slug, title, city, venue_name, starts_at, ends_at, status, category, halal_friendly, cover_url, ticket_types(price_kobo, on_sale, quantity, sold)")
    .eq("status", "published")
    .order("starts_at", { ascending: true })
    .limit(60)
  // Hide events that have ended (no end time: treated as 6 hours long).
  const { now, sixAgo } = clock()
  query = query.or(`ends_at.gt.${now},and(ends_at.is.null,starts_at.gt.${sixAgo})`)
  if (type) query = query.eq("category", type)
  if (city) query = query.eq("city", city)
  if (halal) query = query.eq("halal_friendly", true)
  if (q) query = query.or(`title.ilike.%${q.replace(/[%,()]/g, " ")}%,venue_name.ilike.%${q.replace(/[%,()]/g, " ")}%`)
  const { data: events } = await query

  const heading = [halal ? "Halal-friendly" : "", type || "Events", city ? `in ${city}` : "near you"].filter(Boolean).join(" ")

  return (
    <div className="wrap">
      <div className="pagehead" data-hero>
        <div>
          <span className="kicker" data-rise><Icon name="search" size={18} />Find events</span>
          <h1 style={{ marginTop: 10 }} data-lines><span className="line"><span>{q ? `“${q}”` : heading}</span></span></h1>
        </div>
      </div>

      <form className="efilter" action="/events" role="search" data-reveal>
        <input name="q" defaultValue={q} placeholder="Trade fair, lecture…" aria-label="Search" autoComplete="off" enterKeyHint="search" />
        <select name="type" defaultValue={type} aria-label="Type">
          <option value="">All events</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select name="city" defaultValue={city} aria-label="City">
          <option value="">Any city</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label className="efilter__halal"><input type="checkbox" name="halal" value="1" defaultChecked={halal} /> Halal-friendly</label>
        <button className="btn btn--primary btn--sm"><span>Find</span><span className="btn__arrow" aria-hidden="true"><Icon name="search" /></span></button>
      </form>

      {(events ?? []).length === 0 ? (
        <div className="card stack" style={{ marginTop: 20 }} data-reveal>
          <p><b>Nothing matches yet.</b></p>
          <p className="muted">New events go live every week. Try another city or type, or <Link href="/events">see everything coming up</Link>.</p>
          <p className="small muted">Hosting something? <Link href="/dashboard">Create your event</Link> and it shows up here.</p>
        </div>
      ) : (
        <div className="ecards">
          {(events ?? []).map((e) => {
            const prices = e.ticket_types.filter((t) => t.on_sale).map((t) => t.price_kobo)
            const from = prices.length ? Math.min(...prices) : null
            const phase = eventPhase(e, e.ticket_types)
            return (
              <Link key={e.slug} href={`/e/${e.slug}`} className="ecard" data-reveal>
                <span className="ecard__img">
                  {e.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.cover_url} alt="" width={640} height={320} loading="lazy" />
                  ) : (
                    <span className="ecard__ph"><Icon name="calendar" size={32} /></span>
                  )}
                  {(phase === "live" || phase === "soldout") && <span className="ecard__phase"><PhasePill phase={phase} /></span>}
                  <span className="ecard__date"><b>{formatDate(e.starts_at, { day: "numeric" })}</b>{formatDate(e.starts_at, { month: "short" })}</span>
                </span>
                <span className="ecard__body">
                  <span className="ecard__cat">{e.category}{e.halal_friendly ? " · Halal-friendly" : ""}</span>
                  <b className="ecard__t">{e.title}</b>
                  <span className="ecard__m">{formatTime(e.starts_at)} · {e.venue_name}, {e.city}</span>
                  <span className="ecard__p">{from === null ? "Tickets soon" : from === 0 ? "Free" : `From ${formatNaira(from)}`}</span>
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function clock() {
  const t = Date.now()
  return { now: new Date(t).toISOString(), sixAgo: new Date(t - 6 * 3_600_000).toISOString() }
}
