import type { Metadata } from "next"
import Link from "next/link"
import { requireHqPage } from "@/lib/hq"
import { formatDate, formatTime } from "@/lib/ganor"
import { Icon } from "@/components/Icon"

export const metadata: Metadata = { title: { absolute: "Ganor" }, robots: { index: false } }

const SEV: Record<string, { label: string; cls: string; icon: string }> = {
  high: { label: "Act now", cls: "badge--bad", icon: "warning" },
  medium: { label: "Soon", cls: "badge--warn", icon: "clock" },
  low: { label: "Tidy up", cls: "", icon: "info" },
  info: { label: "Good news", cls: "badge--ok", icon: "check-circle" },
}

// One list of what needs attention across Ganor, worst first.
export default async function Watchlist() {
  const { supabase } = await requireHqPage("watch")
  const [{ data }, { data: slugs }] = await Promise.all([
    supabase.rpc("admin_watchlist"),
    supabase.from("events").select("id, slug").limit(1000),
  ])
  const slug = new Map((slugs ?? []).map((e) => [e.id, e.slug]))
  const items = data ?? []
  const count = (s: string) => items.filter((i) => i.severity === s).length
  return (
    <div className="stack">
      <h1 className="hq__h1"><Icon name="warning" size={26} />Watchlist</h1>
      <p className="muted">Things that could go wrong for hosts or guests, checked live. Clear them and this page stays empty.</p>
      <div className="evstats">
        {(["high", "medium", "low", "info"] as const).map((s) => <span key={s} className="badge" style={{ padding: "6px 10px", fontSize: 13 }}>{SEV[s].label} <b>{count(s)}</b></span>)}
      </div>
      {items.length === 0 ? (
        <div className="card empty"><Icon name="check-circle" size={44} /><h2>All clear</h2><p>Nothing needs attention right now.</p></div>
      ) : (
        <div className="alist">
          {items.map((i, k) => {
            const sv = SEV[i.severity] ?? SEV.low
            const s = i.event_id ? slug.get(i.event_id) : null
            return (
              <article key={k} className="card arow">
                <span className={`arow__ic arow__ic--${i.severity}`} aria-hidden="true"><Icon name={sv.icon} size={20} /></span>
                <div className="arow__main">
                  <b>{i.title} <span className={`badge ${sv.cls}`}>{sv.label}</span></b>
                  <small>{i.detail}</small>
                  {i.event_id && <small>{formatDate(i.at)} · {formatTime(i.at)}</small>}
                </div>
                <div className="arow__side actions" style={{ gap: 6 }}>
                  {s && <Link href={`/e/${s}`} className="btn btn--ghost btn--xs btn--plain">Event page</Link>}
                  {i.kind.startsWith("payout") || i.kind === "no_payout" ? <Link href="/hq/payouts" className="btn btn--ghost btn--xs btn--plain">Payouts</Link>
                    : i.host_id ? <Link href={`/hq/hosts`} className="btn btn--ghost btn--xs btn--plain">Hosts</Link> : null}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
