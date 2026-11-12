import type { Metadata } from "next"
import Link from "next/link"
import { getUserId } from "@/lib/supabase/server"
import { Icon } from "@/components/Icon"
import { PhasePill } from "@/components/PhasePill"
import { eventPhase, formatDate, formatTime, PHASE_LABEL, RATINGS_ENABLED, type EventPhase } from "@/lib/ganor"
import { CountUp } from "@/components/widgets/CountUp"
import { BarChart } from "@/components/widgets/BarChart"
import { LiveRefresh } from "@/components/widgets/LiveRefresh"

export const metadata: Metadata = { title: "Ganor HQ", robots: { index: false } }

type Overview = Record<string, number>

const STAGES: { key: EventPhase; color: string }[] = [
  { key: "live", color: "var(--ganor-indigo)" },
  { key: "upcoming", color: "var(--ganor-success)" },
  { key: "soldout", color: "var(--ganor-marigold)" },
  { key: "draft", color: "#B9B3C9" },
  { key: "ended", color: "#5B5870" },
  { key: "cancelled", color: "var(--ganor-danger)" },
]

export default async function AdminOverview() {
  const { supabase } = await getUserId()
  const [{ data: o }, { data: log }, { data: daily }, { data: events }] = await Promise.all([
    supabase.rpc("admin_overview"),
    supabase.rpc("admin_recent_actions", { p_limit: 6 }),
    supabase.rpc("admin_daily", { p_days: 14 }),
    supabase.from("events").select("id, title, slug, starts_at, ends_at, status, profiles(display_name), ticket_types(quantity, sold, on_sale)").order("starts_at").limit(1000),
  ])
  const v = (o ?? {}) as Overview
  const days = (daily ?? []).map((d) => ({ ...d, label: formatDate(`${d.day}T12:00:00Z`, { day: "numeric", month: "short" }), sub: formatDate(`${d.day}T12:00:00Z`, { weekday: "long", day: "numeric", month: "short" }) }))
  const sum = (k: "tickets" | "hosts" | "checkins" | "events") => days.reduce((n, d) => n + d[k], 0)

  const phased = (events ?? []).map((e) => ({ e, phase: eventPhase(e, e.ticket_types) }))
  const counts = Object.fromEntries(STAGES.map((s) => [s.key, phased.filter((p) => p.phase === s.key).length])) as Record<EventPhase, number>
  const totalEvents = phased.length || 1
  const happening = phased.filter((p) => p.phase === "live")
  const next = phased.filter((p) => p.phase === "upcoming" || p.phase === "soldout").slice(0, 5)

  const tiles = [
    { label: "Hosts", value: v.hosts ?? 0, sub: `${v.new_hosts_7d ?? 0} new this week`, icon: "user", href: "/hq/hosts", tone: "indigo" },
    { label: "On sale and live", value: counts.live + counts.upcoming + counts.soldout, sub: `${counts.live} happening now · ${counts.draft} drafts`, icon: "calendar", href: "/hq/events", tone: "green" },
    { label: "Tickets sold", value: v.tickets_sold ?? 0, sub: `${v.paid_orders ?? 0} orders · ${v.refunds ?? 0} refunds`, icon: "ticket", tone: "marigold" },
    { label: "Gross sales", value: Math.round((v.gross_kobo ?? 0) / 100), sub: "Before fees and refunds", icon: "wallet", tone: "indigo", naira: true },
    { label: "Gate accounts", value: v.gate_accounts ?? 0, sub: "Active check-in logins", icon: "qr-code", tone: "ink" },
    RATINGS_ENABLED
      ? { label: "Reports waiting", value: v.open_reports ?? 0, sub: `${v.reviews ?? 0} published reviews`, icon: "warning", href: "/hq/ratings", tone: "danger" }
      : { label: "Suspended hosts", value: v.suspended ?? 0, sub: "Hidden from guests", icon: "shield", href: "/hq/hosts?show=suspended", tone: "danger" },
  ]

  return (
    <div className="stack aov">
      <div className="aov__head">
        <h1>Ganor overview</h1>
        <LiveRefresh />
      </div>

      <div className="astats">
        {tiles.map((t) => (
          <article key={t.label} className={`card astat astat--${t.tone}`} data-reveal>
            <span className="astat__ic" aria-hidden="true"><Icon name={t.icon} size={22} /></span>
            <p className="astat__l">{t.label}</p>
            <p className="astat__v">{"naira" in t && t.naira ? "₦" : ""}<CountUp value={t.value} /></p>
            <p className="astat__s">{"href" in t && t.href ? <Link href={t.href}>{t.sub}</Link> : t.sub}</p>
          </article>
        ))}
      </div>

      <div className="aov__charts">
        <article className="card awidget awidget--wide" data-reveal>
          <header className="awidget__head">
            <span className="awidget__ic"><Icon name="ticket" size={18} /></span>
            <div><h2>Tickets sold</h2><p>Last 14 days · {sum("tickets")} total</p></div>
          </header>
          <BarChart points={days.map((d) => ({ label: d.label, sub: d.sub, value: d.tickets }))} unit="tickets" />
        </article>
        <article className="card awidget" data-reveal>
          <header className="awidget__head">
            <span className="awidget__ic awidget__ic--green"><Icon name="user" size={18} /></span>
            <div><h2>New hosts</h2><p>Last 14 days · {sum("hosts")} joined</p></div>
          </header>
          <BarChart points={days.map((d) => ({ label: d.label, sub: d.sub, value: d.hosts }))} unit="hosts" color="var(--ganor-success)" />
        </article>
        <article className="card awidget" data-reveal>
          <header className="awidget__head">
            <span className="awidget__ic awidget__ic--marigold"><Icon name="scan" size={18} /></span>
            <div><h2>Gate check-ins</h2><p>Last 14 days · {sum("checkins")} scanned</p></div>
          </header>
          <BarChart points={days.map((d) => ({ label: d.label, sub: d.sub, value: d.checkins }))} unit="check-ins" color="#C98A00" />
        </article>
      </div>

      <article className="card awidget" data-reveal>
        <header className="awidget__head">
          <span className="awidget__ic"><Icon name="calendar" size={18} /></span>
          <div><h2>Events by stage</h2><p>{phased.length} events on Ganor</p></div>
        </header>
        <div className="stagebar" role="img" aria-label={STAGES.map((s) => `${PHASE_LABEL[s.key]} ${counts[s.key]}`).join(", ")}>
          {STAGES.filter((s) => counts[s.key] > 0).map((s, i) => (
            <i key={s.key} style={{ flexGrow: counts[s.key] / totalEvents, background: s.color, "--d": `${i * 60}ms` } as React.CSSProperties} title={`${PHASE_LABEL[s.key]}: ${counts[s.key]}`} />
          ))}
        </div>
        <ul className="stagekey">
          {STAGES.map((s) => (
            <li key={s.key}><i style={{ background: s.color }} aria-hidden="true" />{PHASE_LABEL[s.key]}<b>{counts[s.key]}</b></li>
          ))}
        </ul>
      </article>

      <div className="admin__cols">
        <section className="card awidget" data-reveal>
          <header className="awidget__head">
            <span className="awidget__ic awidget__ic--live"><Icon name="clock" size={18} /></span>
            <div><h2>Happening now and next</h2><p>{happening.length} live · {next.length} coming up</p></div>
          </header>
          {happening.length + next.length === 0 ? <p className="muted">Nothing live or coming up.</p> : (
            <ul className="sendlist">
              {[...happening, ...next].map(({ e, phase }) => (
                <li key={e.id}>
                  <span><b>{e.title}</b><small>{formatDate(e.starts_at)} · {formatTime(e.starts_at)} · {(e.profiles as unknown as { display_name: string } | null)?.display_name}</small></span>
                  <span className="actions" style={{ gap: 6 }}><PhasePill phase={phase} /><Link href={`/e/${e.slug}`} className="btn btn--ghost btn--xs btn--plain">View</Link></span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card awidget" data-reveal>
          <header className="awidget__head">
            <span className="awidget__ic awidget__ic--ink"><Icon name="shield" size={18} /></span>
            <div><h2>Recent admin actions</h2><p><Link href="/hq/staff">Full log</Link></p></div>
          </header>
          {(log ?? []).length === 0 ? <p className="muted">Nothing yet. Suspensions, event changes and review decisions show here.</p> : (
            <ul className="sendlist">
              {(log ?? []).map((l, i) => (
                <li key={i}><span><b>{l.action.replace(/_/g, " ")}</b><small>{l.actor_name} · {formatDate(l.created_at, { day: "numeric", month: "short" })} {formatTime(l.created_at)}{l.note ? ` · ${l.note}` : ""}</small></span></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
