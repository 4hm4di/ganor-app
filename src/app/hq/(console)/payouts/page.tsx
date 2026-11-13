import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireHqPage } from "@/lib/hq"
import { formatDate, formatNaira } from "@/lib/ganor"
import { maskAccount } from "@/lib/banks"
import { planById, naira } from "@/lib/plans"
import { setPayoutStatus, setPlanPaid } from "../actions"
import { Icon } from "@/components/Icon"

export const metadata: Metadata = { title: { absolute: "Ganor" }, robots: { index: false } }

const LABEL: Record<string, [string, string]> = {
  missing: ["No details", "badge--bad"], pending: ["To check", "badge--warn"], verified: ["Verified", "badge--ok"], rejected: ["Rejected", "badge--bad"],
}

export default async function Payouts({ searchParams }: { searchParams: Promise<{ show?: string; full?: string }> }) {
  const { show = "all", full } = await searchParams
  const { me, supabase } = await requireHqPage("payouts")
  if (!me.can.finance) notFound()
  const [{ data }, { data: plans }] = await Promise.all([supabase.rpc("admin_payouts"), supabase.rpc("admin_rsvp_plans")])
  const due = (plans ?? []).filter((p) => !p.paid_at)
  const rows = (data ?? []).filter((r) => show === "all" || r.status === show)
  const sum = (k: "gross_kobo" | "tickets_sold") => (data ?? []).reduce((n, r) => n + Number(r[k] ?? 0), 0)
  return (
    <div className="stack">
      <h1 className="hq__h1"><Icon name="wallet" size={26} />Payouts</h1>
      <p className="muted">Hosts who sell paid tickets, their settlement accounts and sales. Check each new account name against the bank before marking it verified.</p>
      <div className="astats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", display: "grid", gap: 10 }}>
        <div className="card"><small className="muted">Paid sales</small><b style={{ display: "block", font: "800 24px/30px var(--ganor-font-display)" }}>{formatNaira(sum("gross_kobo"))}</b></div>
        <div className="card"><small className="muted">Paid tickets</small><b style={{ display: "block", font: "800 24px/30px var(--ganor-font-display)" }}>{sum("tickets_sold").toLocaleString("en-NG")}</b></div>
        <div className="card"><small className="muted">To check</small><b style={{ display: "block", font: "800 24px/30px var(--ganor-font-display)" }}>{(data ?? []).filter((r) => r.status === "pending").length}</b></div>
        <div className="card"><small className="muted">Missing details</small><b style={{ display: "block", font: "800 24px/30px var(--ganor-font-display)" }}>{(data ?? []).filter((r) => r.status === "missing").length}</b></div>
      </div>
      <section className="stack" style={{ gap: 10 }}>
        <h2 className="admin__h2">RSVP plan payments {due.length > 0 && <span className="badge badge--warn">{due.length} due</span>}</h2>
        <p className="small muted">Hosts pay one plan per RSVP event by transfer, quoting the reference. Mark it paid once the money is in; they can publish straight away.</p>
        {(plans ?? []).length === 0 ? <p className="muted">No RSVP events yet.</p> : (
          <div className="alist">
            {(plans ?? []).map((p) => {
              const plan = planById(p.plan)
              return (
                <article key={p.event_id} className="card arow">
                  <span className={`arow__ic${p.paid_at ? " arow__ic--info" : " arow__ic--medium"}`} aria-hidden="true"><Icon name={p.paid_at ? "check-circle" : "wallet"} size={20} /></span>
                  <div className="arow__main">
                    <b>{p.title} <span className={`badge ${p.paid_at ? "badge--ok" : "badge--warn"}`}>{p.paid_at ? "Paid" : "Due"}</span></b>
                    <small>{plan.name} · {naira(plan.price)} · {p.host_name} · ref <b>{p.event_id.slice(0, 8).toUpperCase()}</b></small>
                    <small>Event {formatDate(p.starts_at, { day: "numeric", month: "short", year: "numeric" })}{p.paid_at ? ` · paid ${formatDate(p.paid_at, { day: "numeric", month: "short" })}` : ""}</small>
                  </div>
                  <form action={setPlanPaid} className="arow__side">
                    <input type="hidden" name="event_id" value={p.event_id} />
                    {p.paid_at
                      ? <button className="btn btn--ghost btn--xs btn--plain" name="paid" value="0">Undo paid</button>
                      : <button className="btn btn--primary btn--xs btn--plain" name="paid" value="1">Mark paid</button>}
                  </form>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <h2 className="admin__h2">Host payout accounts</h2>
      <form className="afilter" style={{ gridTemplateColumns: "1fr auto auto" }}>
        <select name="show" defaultValue={show} aria-label="Status">
          <option value="all">All hosts</option><option value="pending">To check</option><option value="missing">No details</option><option value="verified">Verified</option><option value="rejected">Rejected</option>
        </select>
        <label className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" name="full" value="1" defaultChecked={!!full} />Show full numbers</label>
        <button className="btn btn--primary btn--sm btn--plain">Filter</button>
      </form>
      <div className="alist">
        {rows.map((r) => {
          const [label, cls] = LABEL[r.status] ?? LABEL.missing
          return (
            <article key={r.host_id} className="card arow">
              <span className={`arow__ic${r.status === "verified" ? " arow__ic--info" : r.status === "pending" ? " arow__ic--medium" : " arow__ic--bad"}`} aria-hidden="true"><Icon name={r.status === "verified" ? "verified" : "wallet"} size={20} /></span>
              <div className="arow__main">
                <b>{r.host_name} <span className={`badge ${cls}`}>{label}</span></b>
                {r.bank_name ? (
                  <small>{r.bank_name} · {full ? r.account_number : maskAccount(r.account_number ?? "")} · {r.account_name} · {r.account_type === "business" ? `Business: ${r.business_name}` : "Individual"}</small>
                ) : <small>No payout account yet. The watchlist flags this while they sell paid tickets.</small>}
                <small>{r.tickets_sold} paid tickets · {formatNaira(Number(r.gross_kobo))} sales · {r.paid_events} paid events{r.updated_at ? ` · updated ${formatDate(r.updated_at, { day: "numeric", month: "short" })}` : ""}</small>
                {r.status_note && <small>Note: {r.status_note}</small>}
              </div>
              {r.bank_name && (
                <form action={setPayoutStatus} className="arow__side stack" style={{ gap: 6 }}>
                  <input type="hidden" name="host_id" value={r.host_id} />
                  <input name="note" placeholder="Note (shown to host if rejected)" maxLength={200} aria-label="Note" style={{ minHeight: 40, padding: "0 10px", borderRadius: 10, border: 0, boxShadow: "inset 0 0 0 1px var(--ganor-line)", background: "var(--surface)", color: "var(--text)" }} />
                  <div className="actions" style={{ gap: 6 }}>
                    {r.status !== "verified" && <button className="btn btn--primary btn--xs btn--plain" name="status" value="verified">Mark verified</button>}
                    {r.status !== "rejected" && <button className="btn btn--danger btn--xs btn--plain" name="status" value="rejected">Reject</button>}
                  </div>
                </form>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
