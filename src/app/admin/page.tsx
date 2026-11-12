import type { Metadata } from "next"
import Link from "next/link"
import { getUserId } from "@/lib/supabase/server"
import { formatDate, formatNaira, formatTime } from "@/lib/ganor"

export const metadata: Metadata = { title: "Admin", robots: { index: false } }

type Overview = Record<string, number>

export default async function AdminHome() {
  const { supabase } = await getUserId()
  const [{ data: o }, { data: log }, { data: soon }] = await Promise.all([
    supabase.rpc("admin_overview"),
    supabase.rpc("admin_recent_actions", { p_limit: 8 }),
    supabase.from("events").select("id, title, slug, starts_at, status, profiles(display_name)").eq("status", "published").gte("starts_at", new Date().toISOString()).order("starts_at").limit(6),
  ])
  const v = (o ?? {}) as Overview
  const stat = (label: string, value: string | number, sub?: string, href?: string) => (
    <article className="card astat" data-reveal>
      <p className="astat__l">{label}</p>
      <p className="astat__v">{value}</p>
      {sub && <p className="astat__s">{href ? <Link href={href}>{sub}</Link> : sub}</p>}
    </article>
  )
  return (
    <div className="stack">
      <h1>Overview</h1>
      <div className="astats">
        {stat("Hosts", v.hosts ?? 0, `${v.new_hosts_7d ?? 0} new this week · ${v.suspended ?? 0} suspended`, "/admin/hosts")}
        {stat("Events", v.events ?? 0, `${v.upcoming ?? 0} upcoming · ${v.drafts ?? 0} drafts`, "/admin/events")}
        {stat("Tickets sold", v.tickets_sold ?? 0, `${v.paid_orders ?? 0} paid orders · ${v.refunds ?? 0} refunds`)}
        {stat("Gross sales", (v.gross_kobo ?? 0) > 0 ? formatNaira(v.gross_kobo) : "₦0", "Before fees and refunds")}
        {stat("Reviews", v.reviews ?? 0, `${v.open_reports ?? 0} reported, waiting`, "/admin/ratings")}
        {stat("Gate accounts", v.gate_accounts ?? 0, "Active check-in logins")}
      </div>

      <div className="admin__cols">
        <section className="card stack" data-reveal>
          <h2 className="admin__h2">Coming up</h2>
          {(soon ?? []).length === 0 ? <p className="muted">No upcoming published events.</p> : (
            <ul className="sendlist">
              {(soon ?? []).map((e) => (
                <li key={e.id}>
                  <span><b>{e.title}</b><small>{formatDate(e.starts_at)} · {formatTime(e.starts_at)} · {(e.profiles as unknown as { display_name: string } | null)?.display_name}</small></span>
                  <Link href={`/e/${e.slug}`} className="btn btn--ghost btn--xs btn--plain">View</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card stack" data-reveal>
          <h2 className="admin__h2">Recent admin actions</h2>
          {(log ?? []).length === 0 ? <p className="muted">Nothing yet. Suspensions, event changes and review decisions show here.</p> : (
            <ul className="sendlist">
              {(log ?? []).map((l, i) => (
                <li key={i}><span><b>{l.action.replace(/_/g, " ")}</b><small>{l.actor_name} · {formatDate(l.created_at, { day: "numeric", month: "short" })} {formatTime(l.created_at)}{l.note ? ` · ${l.note}` : ""}</small></span></li>
              ))}
            </ul>
          )}
          <Link href="/admin/staff" className="small">Full log</Link>
        </section>
      </div>
    </div>
  )
}
