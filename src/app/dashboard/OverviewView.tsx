import Link from "next/link"
import { Icon } from "@/components/Icon"
import { PhasePill } from "@/components/PhasePill"
import { CountUp } from "@/components/widgets/CountUp"
import { BarChart } from "@/components/widgets/BarChart"
import { SalesTrend } from "@/components/widgets/SalesTrend"
import { eventPhase, formatDate, formatNaira, formatTime, PHASE_LABEL, type EventPhase } from "@/lib/ganor"

export type Totals = { tickets: number; orders: number; take_home: number; checkins: number }
export type Stats = { days: number; series: { day: string; tickets: number; take_home: number; checkins: number }[]; current: Totals; previous: Totals; all_time: { tickets: number; take_home: number; checkins: number } }

export const RANGES = [7, 30, 90] as const
const STAGES: { key: EventPhase; color: string }[] = [
  { key: "live", color: "var(--ganor-indigo)" },
  { key: "upcoming", color: "var(--ganor-success)" },
  { key: "soldout", color: "var(--ganor-marigold)" },
  { key: "draft", color: "#B9B3C9" },
  { key: "ended", color: "#5B5870" },
  { key: "cancelled", color: "var(--ganor-danger)" },
]

// Change against the previous period of the same length. Null when there is nothing to compare.
function change(cur: number, prev: number) {
  if (prev === 0) return cur === 0 ? null : { text: "New", dir: "up" as const }
  const pct = Math.round(((cur - prev) / prev) * 100)
  return { text: `${pct > 0 ? "+" : ""}${pct}%`, dir: pct > 0 ? ("up" as const) : pct < 0 ? ("down" as const) : ("flat" as const) }
}

export type OverviewEvent = {
  id: string; title: string; slug: string; city: string; venue_name: string; starts_at: string; ends_at: string | null; status: string; cover_url: string | null
  ticket_types: { quantity: number; sold: number; on_sale: boolean; price_kobo: number }[]
}

export function OverviewView({ range, first, stats, events, suspended, passwordUpdated }: {
  range: number; first?: string; stats: Stats | null; events: OverviewEvent[]; suspended: { reason: string } | null; passwordUpdated: boolean
}) {
  const sp = { password: passwordUpdated ? "updated" : undefined }

  const phased = (events ?? []).map((e) => ({ e, phase: eventPhase(e, e.ticket_types) }))
  const counts = Object.fromEntries(STAGES.map((s) => [s.key, phased.filter((p) => p.phase === s.key).length])) as Record<EventPhase, number>
  const live = phased.filter((p) => p.phase === "live")
  const coming = phased.filter((p) => p.phase === "upcoming" || p.phase === "soldout")
  const nextUp = live[0] ?? coming[0] ?? null

  // Things the host can act on now.
  const todo: { text: string; href: string; icon: string }[] = []
  for (const { e, phase } of phased) {
    if (phase === "draft" && e.ticket_types.length === 0) todo.push({ text: `Add tickets to “${e.title}” so you can publish it`, href: `/dashboard/events/${e.id}`, icon: "ticket" })
    else if (phase === "draft" && new Date(e.starts_at) > new Date()) todo.push({ text: `“${e.title}” is ready to publish`, href: `/dashboard/events/${e.id}`, icon: "send" })
    if ((phase === "upcoming" || phase === "draft") && !e.cover_url) todo.push({ text: `Add a banner to “${e.title}”`, href: `/dashboard/events/${e.id}`, icon: "image" })
    if (phase === "upcoming" && e.ticket_types.every((t) => t.on_sale === false)) todo.push({ text: `No tickets are on sale for “${e.title}”`, href: `/dashboard/events/${e.id}`, icon: "warning" })
  }

  const cur = stats?.current ?? { tickets: 0, orders: 0, take_home: 0, checkins: 0 }
  const prev = stats?.previous ?? { tickets: 0, orders: 0, take_home: 0, checkins: 0 }
  const series = (stats?.series ?? []).map((d) => ({
    label: formatDate(`${d.day}T12:00:00Z`, { day: "numeric", month: "short" }),
    sub: formatDate(`${d.day}T12:00:00Z`, { weekday: "long", day: "numeric", month: "short" }),
    tickets: d.tickets,
    checkins: d.checkins,
    take_home: d.take_home,
  }))
  const recentPace = series.slice(-7).reduce((n, d) => n + d.tickets, 0)
  // Per event, from the same counters My events uses, so the numbers always match.
  const byEvent = phased
    .map(({ e, phase }) => ({ e, phase, sold: e.ticket_types.reduce((n, t) => n + t.sold, 0), cap: e.ticket_types.reduce((n, t) => n + t.quantity, 0), free: e.ticket_types.length > 0 && e.ticket_types.every((t) => t.price_kobo === 0) }))
    .filter((x) => x.sold > 0 || x.phase === "upcoming" || x.phase === "live")
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 6)
  const topSold = Math.max(1, ...byEvent.map((x) => x.sold))
  const allSold = phased.reduce((n, { e }) => n + e.ticket_types.reduce((m, t) => m + t.sold, 0), 0)
  const ticketsChange = change(cur.tickets, prev.tickets)
  const period = `last ${range} days`

  const kpis = [
    { label: "Tickets and RSVPs", value: cur.tickets, ch: ticketsChange, sub: `${allSold} across all your events`, icon: "ticket", tone: "indigo" },
    { label: "Your take-home", value: Math.round(cur.take_home / 100), naira: true, ch: change(cur.take_home, prev.take_home), sub: "After the Ganor fee", icon: "wallet", tone: "green" },
    { label: "Checked in", value: cur.checkins, ch: change(cur.checkins, prev.checkins), sub: "Guests scanned at the gate", icon: "scan", tone: "marigold" },
    { label: "Upcoming events", value: coming.length + live.length, ch: null, sub: `${counts.draft} drafts`, icon: "calendar", tone: "ink" },
  ]

  return (
    <div className="wrap hov">
      <div className="hov__head">
        <div>
          <span className="kicker"><Icon name="home" size={18} />Overview</span>
          <h1>{first ? `Hi ${first}` : "Your overview"}</h1>
          <p className="muted">Numbers for your events only.</p>
        </div>
        <nav className="seg2" aria-label="Date range">
          {RANGES.map((r) => (
            <Link key={r} href={`/dashboard?range=${r}`} className={r === range ? "is-on" : ""} aria-current={r === range ? "true" : undefined} scroll={false}>
              {r} days
            </Link>
          ))}
        </nav>
      </div>

      {suspended && (
        <div className="alert alert--error" role="alert"><Icon name="warning" /><span>Your host account is suspended, so your events are hidden and you can&rsquo;t publish. Reason: {suspended.reason}. Contact support@ganor.ng to resolve this.</span></div>
      )}
      {sp.password === "updated" && <div className="alert alert--ok" role="status"><Icon name="check-circle" /><span>Your password was updated.</span></div>}

      <div className="astats hov__kpis">
        {kpis.map((k) => (
          <article key={k.label} className={`card astat astat--${k.tone}`} data-reveal>
            <span className="astat__ic" aria-hidden="true"><Icon name={k.icon} size={22} /></span>
            <p className="astat__l">{k.label}</p>
            <p className="astat__v">{"naira" in k && k.naira ? "₦" : ""}<CountUp value={k.value} /></p>
            <p className="astat__s">
              {k.ch && <span className={`delta delta--${k.ch.dir}`}>{k.ch.dir === "up" ? "▲" : k.ch.dir === "down" ? "▼" : "■"} {k.ch.text}</span>}
              {k.ch ? ` vs previous ${range} days · ` : ""}{k.sub}
            </p>
          </article>
        ))}
      </div>

      <div className="dash">
        <article className="card awidget s-8" data-reveal>
          <header className="awidget__head">
            <span className="awidget__ic"><Icon name="receipt" size={18} /></span>
            <div>
              <h2>{cur.tickets === 0 ? `No tickets in the ${period}` : `${cur.tickets} tickets and RSVPs in the ${period}`}</h2>
              <p>{ticketsChange ? `${ticketsChange.text} vs the ${range} days before` : "Each bar is one day"} · {formatNaira(cur.take_home) === "Free" ? "₦0" : formatNaira(cur.take_home)} take-home</p>
            </div>
          </header>
          <SalesTrend days={series.map((d) => ({ day: d.label, label: d.label, count: d.tickets }))} total={cur.tickets} capacity={0} daysLeft={recentPace > 0 ? 7 : 0} unit="tickets and RSVPs" endLabel="next 7 days" projDelta />
        </article>

        <article className="card awidget hov__next s-4" data-reveal>
          <header className="awidget__head">
            <span className={`awidget__ic${nextUp?.phase === "live" ? " awidget__ic--live" : ""}`}><Icon name="clock" size={18} /></span>
            <div><h2>{nextUp?.phase === "live" ? "Happening now" : "Next up"}</h2><p>{coming.length + live.length} upcoming</p></div>
          </header>
          {nextUp ? (
            <div className="nextup">
              <div className="nextup__img">
                {nextUp.e.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={nextUp.e.cover_url} alt="" width={640} height={320} />
                ) : <span><Icon name="calendar" size={28} /></span>}
              </div>
              <div className="nextup__body">
                <PhasePill phase={nextUp.phase} />
                <b>{nextUp.e.title}</b>
                <small>{formatDate(nextUp.e.starts_at)} · {formatTime(nextUp.e.starts_at)} · {nextUp.e.venue_name}, {nextUp.e.city}</small>
                <small>{nextUp.e.ticket_types.reduce((n, t) => n + t.sold, 0)} of {nextUp.e.ticket_types.reduce((n, t) => n + t.quantity, 0)} taken</small>
              </div>
              <div className="nextup__actions">
                <Link href={`/dashboard/events/${nextUp.e.id}`} className="btn btn--primary btn--sm"><span>Manage</span><span className="btn__arrow" aria-hidden="true"><Icon name="arrow" /></span></Link>
                <Link href={`/gate/${nextUp.e.id}?as=host`} className="btn btn--ghost btn--sm btn--plain"><Icon name="qr-code" size={18} />Scanner</Link>
              </div>
            </div>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              <p className="muted">Nothing coming up. Create an event and it shows here.</p>
              <Link href="/dashboard/events/new" className="btn btn--primary btn--sm" style={{ justifySelf: "start" }}><span>New event</span><span className="btn__arrow" aria-hidden="true"><Icon name="add-circle" /></span></Link>
            </div>
          )}
        </article>

        <article className="card awidget s-5" data-reveal>
          <header className="awidget__head">
            <span className="awidget__ic"><Icon name="ticket" size={18} /></span>
            <div><h2>Tickets by event</h2><p>{allSold} in total · same counts as <Link href="/dashboard/events">My events</Link></p></div>
          </header>
          {byEvent.length ? (
            <ul className="rank">
              {byEvent.map((x, i) => (
                <li key={x.e.id}>
                  <Link href={`/dashboard/events/${x.e.id}`}>
                    <span className="rank__t">{x.e.title}</span>
                    <span className="rank__n">{x.sold}<small>/{x.cap}</small></span>
                    <span className="rank__bar" aria-hidden="true"><i style={{ "--w": x.sold / topSold, "--d": `${i * 60}ms`, background: x.free ? "var(--ganor-success)" : "var(--chart-bar)" } as React.CSSProperties} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="muted">No tickets yet.</p>}
        </article>

        <article className="card awidget s-4" data-reveal>
          <header className="awidget__head">
            <span className="awidget__ic awidget__ic--green"><Icon name="scan" size={18} /></span>
            <div><h2>{cur.checkins} checked in</h2><p>Gate scans per day, {period}</p></div>
          </header>
          <BarChart points={series.map((d) => ({ label: d.label, sub: d.sub, value: d.checkins }))} unit="scanned in" color="var(--ganor-success)" />
        </article>

        <article className="card awidget s-3" data-reveal>
          <header className="awidget__head">
            <span className="awidget__ic"><Icon name="calendar" size={18} /></span>
            <div><h2>By stage</h2><p>{phased.length} event{phased.length === 1 ? "" : "s"}</p></div>
          </header>
          <div className="stagebar" role="img" aria-label={STAGES.map((s) => `${PHASE_LABEL[s.key]} ${counts[s.key]}`).join(", ")}>
            {STAGES.filter((s) => counts[s.key] > 0).map((s, i) => (
              <i key={s.key} style={{ flexGrow: counts[s.key] / Math.max(1, phased.length), background: s.color, "--d": `${i * 60}ms` } as React.CSSProperties} />
            ))}
          </div>
          <ul className="stagekey">
            {STAGES.map((s) => <li key={s.key}><i style={{ background: s.color }} aria-hidden="true" />{PHASE_LABEL[s.key]}<b>{counts[s.key]}</b></li>)}
          </ul>
        </article>

        <article className="card awidget s-7" data-reveal>
          <header className="awidget__head">
            <span className="awidget__ic awidget__ic--green"><Icon name="wallet" size={18} /></span>
            <div><h2>{formatNaira(cur.take_home) === "Free" ? "₦0" : formatNaira(cur.take_home)} take-home</h2><p>Per day after the Ganor fee, {period}</p></div>
          </header>
          <BarChart points={series.map((d) => ({ label: d.label, sub: d.sub, value: Math.round(d.take_home / 100) }))} unit="naira" color="var(--ganor-indigo)" />
        </article>

        <article className="card awidget s-5" data-reveal>
          <header className="awidget__head">
            <span className="awidget__ic awidget__ic--marigold"><Icon name="warning" size={18} /></span>
            <div><h2>{todo.length ? `${todo.length} thing${todo.length === 1 ? "" : "s"} to do` : "All set"}</h2><p>Quick fixes for your events</p></div>
          </header>
          {todo.length ? (
            <ul className="todo">
              {todo.slice(0, 6).map((t, i) => (
                <li key={i}><Link href={t.href}><Icon name={t.icon} size={18} /><span>{t.text}</span><Icon name="arrow-right" size={16} /></Link></li>
              ))}
            </ul>
          ) : <p className="muted">Nothing needs your attention right now.</p>}
        </article>
      </div>

      <p className="hov__foot small muted">
        All time: {stats?.all_time.tickets ?? 0} tickets · {(stats?.all_time.take_home ?? 0) > 0 ? formatNaira(stats!.all_time.take_home) : "₦0"} take-home · {stats?.all_time.checkins ?? 0} checked in. Updated {formatTime(new Date().toISOString())}.
      </p>
    </div>
  )
}
