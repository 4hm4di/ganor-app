import type { Metadata } from "next"
import { getHq } from "@/lib/hq"
import { formatDate } from "@/lib/ganor"
import { SuspendForm } from "../AdminForms"

export const metadata: Metadata = { title: { absolute: "Ganor" }, robots: { index: false } }

export default async function AdminHosts({ searchParams }: { searchParams: Promise<{ q?: string; show?: string }> }) {
  const { q = "", show = "all" } = await searchParams
  const { supabase, me } = await getHq()
  const { data } = await supabase.rpc("admin_hosts")
  const needle = q.trim().toLowerCase()
  const hosts = (data ?? []).filter((h) =>
    (show === "suspended" ? h.suspended : show === "active" ? !h.suspended : true) &&
    (!needle || h.display_name.toLowerCase().includes(needle) || (h.email ?? "").toLowerCase().includes(needle)),
  )
  return (
    <div className="stack">
      <h1>Hosts</h1>
      <form className="afilter" role="search">
        <input name="q" defaultValue={q} placeholder={me?.can.contacts ? "Search name or email…" : "Search name…"} aria-label="Search hosts" autoComplete="off" />
        <select name="show" defaultValue={show} aria-label="Show">
          <option value="all">All hosts</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button className="btn btn--primary btn--sm btn--plain">Filter</button>
      </form>
      <p className="small muted">{hosts.length} of {(data ?? []).length} hosts</p>
      <div className="alist">
        {hosts.map((h) => (
          <article key={h.id} className={`card arow${h.suspended ? " is-suspended" : ""}`}>
            <div className="arow__main">
              <b>{h.display_name || "Unnamed host"} {h.is_staff && <span className="badge badge--ok">Ganor staff</span>} {h.suspended && <span className="badge badge--bad">Suspended</span>}</b>
              <small>{h.email ? `${h.email} · ` : ""}joined {formatDate(h.joined_at, { day: "numeric", month: "short", year: "numeric" })}{h.last_sign_in_at ? ` · last in ${formatDate(h.last_sign_in_at, { day: "numeric", month: "short" })}` : ""}</small>
              <small>{h.events} events ({h.published} live) · {h.tickets_sold} tickets sold · {h.gate_accounts} gate accounts</small>
              {h.suspended && h.suspend_reason && <small>Reason: {h.suspend_reason}</small>}
            </div>
            {me?.can.moderate && <SuspendForm hostId={h.id} suspended={h.suspended} />}
          </article>
        ))}
      </div>
    </div>
  )
}
