import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requireHqPage } from "@/lib/hq"
import { formatDate, formatNaira, formatTime } from "@/lib/ganor"
import { maskAccount } from "@/lib/banks"
import { planById, naira } from "@/lib/plans"
import { setPayoutStatus, setPlanPaid } from "../actions"
import { Icon } from "@/components/Icon"
import { Figure } from "@/components/widgets/Figure"
import { SubmitButton } from "@/components/SubmitButton"

export const metadata: Metadata = { title: { absolute: "Ganor" }, robots: { index: false } }

type Tab = "accounts" | "plans" | "track"
type Search = { tab?: string; show?: string; full?: string; q?: string }

const STATUS: Record<string, { label: string; badge: string; tone: string; icon: string }> = {
  pending: { label: "To check", badge: "badge--warn", tone: "medium", icon: "clock" },
  missing: { label: "No details", badge: "badge--bad", tone: "bad", icon: "warning" },
  verified: { label: "Verified", badge: "badge--ok", tone: "info", icon: "verified" },
  rejected: { label: "Rejected", badge: "badge--bad", tone: "bad", icon: "close-circle" },
}
const SHOW: { value: string; label: string }[] = [
  { value: "pending", label: "To check" },
  { value: "missing", label: "No details" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
]

type Tracked = {
  code: string; price_kobo: number; checked_in_at: string | null; checked_in_by: string | null; created_at: string
  ticket_type: string | null; event_id: string; event_title: string; event_slug: string; starts_at: string; event_status: string; event_kind: string; visibility: string
  host_name: string | null; order_id: string; order_ref: string; order_status: string; total_kobo: number
  buyer_name: string; buyer_phone: string | null; buyer_email: string | null; paystack_reference: string | null
  paid_at: string | null; refunded_at: string | null; view_token: string | null; order_tickets: number
}

function ticketState(t: Tracked): { label: string; badge: string; icon: string; tone: string } {
  if (t.order_status === "refunded") return { label: "Refunded", badge: "badge--bad", icon: "receipt", tone: "bad" }
  if (t.order_status === "cancelled") return { label: "Cancelled", badge: "badge--bad", icon: "close-circle", tone: "bad" }
  if (t.order_status === "pending") return { label: "Awaiting payment", badge: "badge--warn", icon: "clock", tone: "medium" }
  if (t.checked_in_at) return { label: "Checked in", badge: "badge--ok", icon: "check-circle", tone: "info" }
  return { label: "Valid · not used yet", badge: "badge--ok", icon: "ticket", tone: "live" }
}

const when = (iso: string) => `${formatDate(iso, { day: "numeric", month: "short", year: "numeric" })}, ${formatTime(iso)}`

export default async function Payouts({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const tab: Tab = sp.tab === "plans" || sp.tab === "track" ? sp.tab : "accounts"
  const { me, supabase } = await requireHqPage("payouts")
  if (!me.can.finance) notFound()

  const [{ data }, { data: plans }] = await Promise.all([supabase.rpc("admin_payouts"), supabase.rpc("admin_rsvp_plans")])
  const all = data ?? []
  const due = (plans ?? []).filter((p) => !p.paid_at)
  const toCheck = all.filter((r) => r.status === "pending").length
  const show = SHOW.some((s) => s.value === sp.show) ? sp.show! : toCheck > 0 ? "pending" : "all"
  const rows = all.filter((r) => show === "all" || r.status === show)
  const sum = (k: "gross_kobo" | "tickets_sold") => all.reduce((n, r) => n + Number(r[k] ?? 0), 0)
  const full = sp.full === "1"
  const href = (p: Partial<Search>) => {
    const u = new URLSearchParams()
    const next = { tab, show: tab === "accounts" ? show : undefined, full: full ? "1" : undefined, ...p }
    Object.entries(next).forEach(([k, v]) => { if (v) u.set(k, v) })
    return `/hq/payouts?${u.toString()}`
  }

  // Ticket tracker
  const q = (sp.q ?? "").trim().slice(0, 80)
  let found: Tracked[] | null = null
  let trackError = ""
  if (tab === "track" && q) {
    const { data: hits, error } = await supabase.rpc("admin_track_ticket", { p_q: q })
    if (error) trackError = error.message.replace(/^.*?: /, "")
    else found = (hits as Tracked[] | null) ?? []
  }

  const tiles = [
    { label: "Paid sales", value: sum("gross_kobo"), naira: true, icon: "wallet", tone: "green", sub: "All hosts, all time" },
    { label: "Paid tickets", value: sum("tickets_sold"), icon: "ticket", tone: "ink", sub: "Tickets sold for money" },
    { label: "Accounts to check", value: toCheck, icon: "verified", tone: toCheck ? "marigold" : "ink", sub: toCheck ? <Link href={href({ tab: "accounts", show: "pending" })}>Check them now</Link> : "All checked" },
    { label: "RSVP plans due", value: due.length, icon: "receipt", tone: due.length ? "marigold" : "ink", sub: due.length ? <Link href={href({ tab: "plans", show: undefined })}>See who owes</Link> : "Nothing owed" },
  ]

  return (
    <div className="stack">
      <h1 className="hq__h1"><Icon name="wallet" size={26} />Payouts</h1>
      <p className="muted">Check hosts&rsquo; bank details, confirm RSVP plan transfers, and look up any ticket.</p>

      <div className="astats">
        {tiles.map((t) => (
          <article key={t.label} className={`card astat astat--${t.tone}`}>
            <span className="astat__ic" aria-hidden="true"><Icon name={t.icon} size={22} /></span>
            <p className="astat__l">{t.label}</p>
            <p className="astat__v"><Figure value={t.value} naira={Boolean(t.naira)} /></p>
            <p className="astat__s">{t.sub}</p>
          </article>
        ))}
      </div>

      <nav className="tabs ptabs" aria-label="Payout sections">
        <Link href={href({ tab: "accounts", show: undefined })} className={`tabs__t${tab === "accounts" ? " is-on" : ""}`} aria-current={tab === "accounts" ? "page" : undefined}><Icon name="card" size={18} />Bank accounts{toCheck > 0 && <span className="ptabs__n">{toCheck}</span>}</Link>
        <Link href={href({ tab: "plans", show: undefined })} className={`tabs__t${tab === "plans" ? " is-on" : ""}`} aria-current={tab === "plans" ? "page" : undefined}><Icon name="receipt" size={18} />RSVP plan payments{due.length > 0 && <span className="ptabs__n">{due.length}</span>}</Link>
        <Link href={href({ tab: "track", show: undefined })} className={`tabs__t${tab === "track" ? " is-on" : ""}`} aria-current={tab === "track" ? "page" : undefined}><Icon name="search" size={18} />Track a ticket</Link>
      </nav>

      {tab === "accounts" && (
        <section className="stack" style={{ gap: 12 }}>
          <ol className="psteps">
            <li><span>1</span>Open your bank app and start a transfer to the account number.</li>
            <li><span>2</span>Compare the name the bank shows with the account name here.</li>
            <li><span>3</span>Same name: <b>Mark verified</b>. Different or wrong: <b>Reject</b> with a note telling the host what to fix.</li>
          </ol>
          <div className="pfilter">
            <div className="seg2" role="group" aria-label="Show">
              {SHOW.map((s) => {
                const n = s.value === "all" ? all.length : all.filter((r) => r.status === s.value).length
                return <Link key={s.value} href={href({ show: s.value })} className={show === s.value ? "is-on" : ""} aria-current={show === s.value ? "true" : undefined}>{s.label} <small>{n}</small></Link>
              })}
            </div>
            <Link href={href({ full: full ? undefined : "1" })} className="btn btn--ghost btn--xs btn--plain"><Icon name={full ? "lock" : "card"} size={16} />{full ? "Hide full numbers" : "Show full numbers"}</Link>
          </div>
          {rows.length === 0 ? (
            <div className="card pempty"><Icon name="check-circle" size={28} /><p><b>{show === "pending" ? "No accounts waiting to be checked." : "Nothing here."}</b><br /><span className="muted small">New payout details from hosts show up under To check.</span></p></div>
          ) : (
            <div className="alist">
              {rows.map((r) => {
                const st = STATUS[r.status] ?? STATUS.missing
                return (
                  <article key={r.host_id} className="card arow pacct">
                    <span className={`arow__ic arow__ic--${st.tone}`} aria-hidden="true"><Icon name={st.icon} size={20} /></span>
                    <div className="arow__main">
                      <b>{r.host_name} <span className={`badge ${st.badge}`}>{st.label}</span></b>
                      {r.bank_name ? (
                        <dl className="pacct__dl">
                          <div><dt>Bank</dt><dd>{r.bank_name}</dd></div>
                          <div><dt>Account number</dt><dd className="mono">{full ? r.account_number : maskAccount(r.account_number ?? "")}</dd></div>
                          <div><dt>Account name</dt><dd>{r.account_name}</dd></div>
                          <div><dt>Type</dt><dd>{r.account_type === "business" ? `Business · ${r.business_name}` : "Individual"}</dd></div>
                        </dl>
                      ) : <small><Icon name="warning" size={14} /> No payout account yet, but they sell paid tickets. They can&rsquo;t be paid until they add one.</small>}
                      <small className="pacct__sales"><Icon name="ticket" size={14} />{r.tickets_sold.toLocaleString("en-NG")} paid tickets · {formatNaira(Number(r.gross_kobo))} sales · {r.paid_events} paid {r.paid_events === 1 ? "event" : "events"}{r.updated_at ? ` · details updated ${formatDate(r.updated_at, { day: "numeric", month: "short" })}` : ""}</small>
                      {r.status_note && <small className="pacct__note"><Icon name="info" size={14} />Note to host: {r.status_note}</small>}
                    </div>
                    {r.bank_name && (
                      <form action={setPayoutStatus} className="arow__side pacct__act">
                        <input type="hidden" name="host_id" value={r.host_id} />
                        <label className="pacct__notef">
                          <span className="small muted">Note to host {r.status !== "rejected" ? "(needed to reject)" : ""}</span>
                          <input name="note" placeholder="e.g. Account name doesn't match" maxLength={200} defaultValue={r.status === "rejected" ? r.status_note ?? "" : ""} />
                        </label>
                        <div className="actions" style={{ gap: 6 }}>
                          {r.status !== "verified" && <SubmitButton name="status" value="verified" size="xs" arrow={false} pendingText="Saving…">Mark verified</SubmitButton>}
                          {r.status !== "rejected" && <SubmitButton name="status" value="rejected" variant="danger" size="xs" arrow={false} pendingText="Saving…">Reject</SubmitButton>}
                        </div>
                      </form>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {tab === "plans" && (
        <section className="stack" style={{ gap: 12 }}>
          <ol className="psteps">
            <li><span>1</span>The host emails support with the event reference and pays by transfer.</li>
            <li><span>2</span>Find the transfer in the bank statement using the reference.</li>
            <li><span>3</span><b>Mark paid</b>. The host can publish straight away.</li>
          </ol>
          {(plans ?? []).length === 0 ? (
            <div className="card pempty"><Icon name="receipt" size={28} /><p><b>No RSVP plan events yet.</b></p></div>
          ) : (
            <div className="alist">
              {[...(plans ?? [])].sort((a, b) => Number(!!a.paid_at) - Number(!!b.paid_at)).map((p) => {
                const plan = planById(p.plan)
                const ref = p.event_id.slice(0, 8).toUpperCase()
                return (
                  <article key={p.event_id} className="card arow">
                    <span className={`arow__ic arow__ic--${p.paid_at ? "info" : "medium"}`} aria-hidden="true"><Icon name={p.paid_at ? "check-circle" : "clock"} size={20} /></span>
                    <div className="arow__main">
                      <b>{p.title} <span className={`badge ${p.paid_at ? "badge--ok" : "badge--warn"}`}>{p.paid_at ? "Paid" : "Waiting for payment"}</span></b>
                      <dl className="pacct__dl">
                        <div><dt>Reference</dt><dd className="mono">{ref}</dd></div>
                        <div><dt>Amount</dt><dd>{naira(plan.price)} · {plan.name}</dd></div>
                        <div><dt>Host</dt><dd>{p.host_name}</dd></div>
                        <div><dt>Event date</dt><dd>{formatDate(p.starts_at, { day: "numeric", month: "short", year: "numeric" })}</dd></div>
                      </dl>
                      {p.paid_at && <small><Icon name="check-circle" size={14} /> Marked paid {formatDate(p.paid_at, { day: "numeric", month: "short" })}</small>}
                    </div>
                    <form action={setPlanPaid} className="arow__side">
                      <input type="hidden" name="event_id" value={p.event_id} />
                      {p.paid_at
                        ? <SubmitButton name="paid" value="0" variant="ghost" size="xs" arrow={false} pendingText="Saving…">Undo paid</SubmitButton>
                        : <SubmitButton name="paid" value="1" size="xs" arrow={false} pendingText="Saving…">Mark paid</SubmitButton>}
                    </form>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {tab === "track" && (
        <section className="stack" style={{ gap: 12 }}>
          <form className="afilter track" role="search">
            <input type="hidden" name="tab" value="track" />
            <input name="q" defaultValue={q} placeholder="Ticket code, order reference, phone or email" aria-label="Find a ticket" autoComplete="off" autoCapitalize="characters" spellCheck={false} enterKeyHint="search" autoFocus={!q} />
            <button className="btn btn--primary btn--sm btn--plain"><Icon name="search" size={18} />Find</button>
          </form>
          <p className="small muted">Ticket codes are on the guest&rsquo;s ticket under the QR code. Phone and email find every order made with them. Each search is recorded in the HQ log.</p>
          {trackError && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{trackError}</span></div>}
          {found && found.length === 0 && (
            <div className="card pempty"><Icon name="search" size={28} /><p><b>No ticket matches &ldquo;{q}&rdquo;.</b><br /><span className="muted small">Check the code for typos (codes never use 0, O, 1, I or L), or try the buyer&rsquo;s phone number.</span></p></div>
          )}
          {found && found.length > 0 && (
            <>
              <p className="small muted">{found.length === 25 ? "Showing the 25 most recent matches." : `${found.length} ${found.length === 1 ? "ticket" : "tickets"} found.`}</p>
              <div className="alist">
                {found.map((t) => {
                  const st = ticketState(t)
                  return (
                    <article key={t.code} className="card trk">
                      <header className="trk__head">
                        <span className={`arow__ic arow__ic--${st.tone}`} aria-hidden="true"><Icon name={st.icon} size={20} /></span>
                        <div>
                          <p className="trk__code mono">{t.code}</p>
                          <p className="small muted">{t.ticket_type ?? "Ticket"} · {t.price_kobo > 0 ? formatNaira(t.price_kobo) : "Free"}</p>
                        </div>
                        <span className={`badge ${st.badge}`}>{st.label}</span>
                      </header>
                      <dl className="pacct__dl">
                        <div><dt>Event</dt><dd>{t.event_title}{t.event_status !== "published" ? ` (${t.event_status})` : ""}{t.visibility === "private" ? " · private" : ""}</dd></div>
                        <div><dt>Date</dt><dd>{when(t.starts_at)}</dd></div>
                        <div><dt>Host</dt><dd>{t.host_name ?? "Unknown"}</dd></div>
                        <div><dt>Guest</dt><dd>{t.buyer_name}</dd></div>
                        <div><dt>Phone</dt><dd>{t.buyer_phone ? <a href={`tel:${t.buyer_phone}`}>{t.buyer_phone}</a> : "None"}</dd></div>
                        <div><dt>Email</dt><dd>{t.buyer_email ? <a href={`mailto:${t.buyer_email}`}>{t.buyer_email}</a> : "None"}</dd></div>
                        <div><dt>Order</dt><dd className="mono">{t.order_ref} · {t.order_tickets} {t.order_tickets === 1 ? "ticket" : "tickets"} · {t.total_kobo > 0 ? formatNaira(t.total_kobo) : "Free"}</dd></div>
                        {t.paystack_reference && <div><dt>Paystack ref</dt><dd className="mono">{t.paystack_reference}</dd></div>}
                      </dl>
                      <ol className="trk__time">
                        <li className="is-done"><Icon name="add-circle" size={16} /><span><b>{t.event_kind === "rsvp" ? "RSVP made" : "Order placed"}</b><small>{when(t.created_at)}</small></span></li>
                        {t.paid_at && <li className="is-done"><Icon name="wallet" size={16} /><span><b>{t.total_kobo > 0 ? "Paid" : "Confirmed"}</b><small>{when(t.paid_at)}</small></span></li>}
                        {t.checked_in_at ? <li className="is-done"><Icon name="scan" size={16} /><span><b>Checked in{t.checked_in_by ? ` by ${t.checked_in_by}` : ""}</b><small>{when(t.checked_in_at)}</small></span></li> : t.order_status === "paid" && <li><Icon name="scan" size={16} /><span><b>Not checked in yet</b><small>Can be scanned at the gate</small></span></li>}
                        {t.refunded_at && <li className="is-bad"><Icon name="receipt" size={16} /><span><b>Refunded</b><small>{when(t.refunded_at)}</small></span></li>}
                      </ol>
                      <div className="actions" style={{ gap: 6 }}>
                        {t.view_token && t.order_status === "paid" && <a href={`/t/${t.view_token}`} target="_blank" rel="noopener" className="btn btn--outline btn--xs btn--plain"><Icon name="ticket" size={16} />Open ticket</a>}
                        <a href={`/e/${t.event_slug}`} target="_blank" rel="noopener" className="btn btn--ghost btn--xs btn--plain"><Icon name="calendar" size={16} />Event page</a>
                        {t.buyer_phone && <a href={`https://wa.me/${t.buyer_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="btn btn--ghost btn--xs btn--plain"><Icon name="whatsapp" size={16} />WhatsApp guest</a>}
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
