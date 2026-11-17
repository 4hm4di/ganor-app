import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { Icon } from "@/components/Icon"
import { Figure } from "@/components/widgets/Figure"
import { feeKobo, formatDate, formatTime, TZ } from "@/lib/ganor"
import { maskAccount } from "@/lib/banks"
import { naira as nairaPlan, planById } from "@/lib/plans"

export const metadata: Metadata = { title: "Wallet" }

const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })
const n = (kobo: number) => money.format(Math.round(kobo / 100))
const monthKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).format(new Date(iso))

type Order = {
  id: string; status: string; total_kobo: number; created_at: string; paid_at: string | null; refunded_at: string | null; buyer_name: string
  events: { id: string; title: string; host_id: string; fee_mode: string; starts_at: string } | null
  tickets: { price_kobo: number }[]
}

// Host wallet: what paid tickets earned, what Ganor kept, refunds, and where payouts go.
export default async function Wallet() {
  const { supabase, userId } = await getUserId()
  if (!userId) redirect("/login")

  const [{ data: rawOrders }, { data: payout }, { data: rsvp }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, status, total_kobo, created_at, paid_at, refunded_at, buyer_name, events!inner(id, title, host_id, fee_mode, starts_at), tickets(price_kobo)")
      .eq("events.host_id", userId)
      .in("status", ["paid", "refunded"])
      .order("created_at", { ascending: false })
      .limit(3000),
    supabase.from("payout_accounts").select("bank_name, account_number, account_name, status, status_note").eq("host_id", userId).maybeSingle(),
    supabase.from("events").select("id, title, rsvp_plan, plan_paid_at, starts_at").eq("host_id", userId).eq("event_kind", "rsvp").neq("rsvp_plan", "free").order("starts_at", { ascending: false }),
  ])

  // Only money moves through the wallet: orders with at least one paid ticket.
  const orders = ((rawOrders ?? []) as unknown as Order[])
    .map((o) => {
      const paid = o.tickets.filter((t) => t.price_kobo > 0)
      const absorb = o.events?.fee_mode === "absorb"
      const fee = paid.reduce((s, t) => s + feeKobo(t.price_kobo), 0)
      const share = paid.reduce((s, t) => s + (absorb ? Math.max(0, t.price_kobo - feeKobo(t.price_kobo)) : t.price_kobo), 0)
      return { ...o, count: paid.length, fee, share, refunded: o.status === "refunded" }
    })
    .filter((o) => o.count > 0)

  const kept = orders.filter((o) => !o.refunded)
  const takeHome = kept.reduce((s, o) => s + o.share, 0)
  const fees = kept.reduce((s, o) => s + o.fee, 0)
  const refunded = orders.filter((o) => o.refunded).reduce((s, o) => s + o.share, 0)
  const thisMonth = monthKey(new Date().toISOString())
  const monthTake = kept.filter((o) => monthKey(o.paid_at ?? o.created_at) === thisMonth).reduce((s, o) => s + o.share, 0)
  const tickets = kept.reduce((s, o) => s + o.count, 0)

  const byEvent = Object.values(
    orders.reduce<Record<string, { id: string; title: string; starts_at: string; tickets: number; sales: number; fees: number; refunds: number; take: number }>>((acc, o) => {
      const e = o.events!
      const row = (acc[e.id] ??= { id: e.id, title: e.title, starts_at: e.starts_at, tickets: 0, sales: 0, fees: 0, refunds: 0, take: 0 })
      if (o.refunded) row.refunds += o.share
      else { row.tickets += o.count; row.sales += o.total_kobo; row.fees += o.fee; row.take += o.share }
      return acc
    }, {}),
  ).sort((a, b) => b.take - a.take)

  const plans = rsvp ?? []
  const status = payout?.status ?? "missing"
  const PAYOUT: Record<string, { cls: string; icon: string; title: string; text: string; cta?: string }> = {
    missing: { cls: "alert--warn", icon: "wallet", title: "Add your payout account", text: "Tell us where to send money from paid tickets. Ganor checks the account before anything is paid out.", cta: "Add account" },
    pending: { cls: "alert--info", icon: "clock", title: "Checking your account", text: "Ganor is confirming the account name with your bank. This is usually quick; you can keep selling meanwhile." },
    rejected: { cls: "alert--error", icon: "warning", title: "Your payout account needs a fix", text: payout?.status_note ? `Ganor says: ${payout.status_note}` : "The details didn't match your bank. Check them and save again.", cta: "Fix details" },
    verified: { cls: "alert--ok", icon: "verified", title: "Payouts are set up", text: "" },
  }
  const p = PAYOUT[status] ?? PAYOUT.missing
  const tiles = [
    { label: "Your take-home", value: Math.round(takeHome / 100), icon: "wallet", tone: "green", sub: `${tickets.toLocaleString("en-NG")} paid ${tickets === 1 ? "ticket" : "tickets"}, all time` },
    { label: "This month", value: Math.round(monthTake / 100), icon: "calendar", tone: "indigo", sub: new Intl.DateTimeFormat("en-NG", { timeZone: TZ, month: "long", year: "numeric" }).format(new Date()) },
    { label: "Ganor fees", value: Math.round(fees / 100), icon: "percent", tone: "ink", sub: "6% + ₦100 per paid ticket" },
    { label: "Refunded", value: Math.round(refunded / 100), icon: "receipt", tone: refunded ? "danger" : "ink", sub: refunded ? "Taken off your take-home" : "No refunds" },
  ]

  return (
    <div className="wrap wallet">
      <div className="pagehead">
        <div>
          <span className="kicker"><Icon name="wallet" size={18} />Wallet</span>
          <h1 style={{ marginTop: 10 }}>Your money</h1>
          <p className="muted">What your paid tickets earned, what Ganor kept, and where your payouts go. Free RSVPs don&rsquo;t pass through your wallet.</p>
        </div>
      </div>

      <div className={`alert ${p.cls} wallet__payout`} role="status">
        <Icon name={p.icon} />
        <span>
          <b>{p.title}.</b>{" "}
          {status === "verified" && payout ? <>Your share goes to <b>{payout.bank_name} {maskAccount(payout.account_number ?? "")}</b> ({payout.account_name}).</> : p.text}
        </span>
        <Link href="/dashboard/profile#payouts" className="alert__link">{p.cta ?? "Change"}</Link>
      </div>

      <div className="astats">
        {tiles.map((t) => (
          <article key={t.label} className={`card astat astat--${t.tone}`} data-reveal>
            <span className="astat__ic" aria-hidden="true"><Icon name={t.icon} size={22} /></span>
            <p className="astat__l">{t.label}</p>
            <p className="astat__v"><Figure value={t.value} naira /></p>
            <p className="astat__s">{t.sub}</p>
          </article>
        ))}
      </div>

      <article className="card wallet__how" data-reveal>
        <h2 className="wallet__h2"><Icon name="route" size={20} />How you get paid</h2>
        <ol className="wallet__steps">
          <li><span className="wallet__step" aria-hidden="true"><Icon name="ticket" size={18} /></span><span><b>A guest pays</b><small>By card, bank transfer or USSD at checkout.</small></span></li>
          <li><span className="wallet__step" aria-hidden="true"><Icon name="percent" size={18} /></span><span><b>The sale is split</b><small>Paystack splits each payment: the Ganor fee to Ganor, the rest to you.</small></span></li>
          <li><span className="wallet__step" aria-hidden="true"><Icon name="wallet" size={18} /></span><span><b>Your share settles to your bank</b><small>Straight to the payout account above. Nothing to request.</small></span></li>
        </ol>
      </article>

      <section className="stack wallet__sec">
        <h2 className="wallet__h2"><Icon name="calendar" size={20} />By event</h2>
        {byEvent.length === 0 ? (
          <div className="card wallet__empty">
            <Icon name="ticket" size={28} />
            <div><b>No paid sales yet.</b><p className="muted small">When guests buy paid tickets, each event&rsquo;s sales, fees and take-home show here.</p></div>
            <Link href="/dashboard/events/new" className="btn btn--primary btn--sm"><span>New event</span><span className="btn__arrow" aria-hidden="true"><Icon name="add-circle" /></span></Link>
          </div>
        ) : (
          <div className="card wtable__wrap">
            <table className="wtable">
              <thead><tr><th scope="col">Event</th><th scope="col">Paid tickets</th><th scope="col">Guests paid</th><th scope="col">Ganor fee</th><th scope="col">Refunds</th><th scope="col">Your take-home</th></tr></thead>
              <tbody>
                {byEvent.map((e) => (
                  <tr key={e.id}>
                    <th scope="row"><Link href={`/dashboard/events/${e.id}`}>{e.title}</Link><small>{formatDate(e.starts_at, { day: "numeric", month: "short", year: "numeric" })}</small></th>
                    <td data-l="Paid tickets">{e.tickets.toLocaleString("en-NG")}</td>
                    <td data-l="Guests paid">{n(e.sales)}</td>
                    <td data-l="Ganor fee">{n(e.fees)}</td>
                    <td data-l="Refunds">{e.refunds ? `−${n(e.refunds)}` : "₦0"}</td>
                    <td data-l="Your take-home"><b>{n(e.take)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {orders.length > 0 && (
        <section className="stack wallet__sec">
          <h2 className="wallet__h2"><Icon name="receipt" size={20} />Recent sales</h2>
          <ul className="card wtx">
            {orders.slice(0, 30).map((o) => (
              <li key={o.id} className={o.refunded ? "is-refunded" : ""}>
                <span className={`wtx__ic${o.refunded ? " wtx__ic--bad" : ""}`} aria-hidden="true"><Icon name={o.refunded ? "receipt" : "ticket"} size={18} /></span>
                <span className="wtx__main">
                  <b>{o.buyer_name}</b>
                  <small>{o.events?.title} · {o.count} {o.count === 1 ? "ticket" : "tickets"} · {formatDate(o.paid_at ?? o.created_at, { day: "numeric", month: "short" })}, {formatTime(o.paid_at ?? o.created_at)}</small>
                </span>
                <span className="wtx__amt">
                  <b>{o.refunded ? `−${n(o.share)}` : `+${n(o.share)}`}</b>
                  <small>{o.refunded ? "Refunded" : `Paid ${n(o.total_kobo)}`}</small>
                </span>
              </li>
            ))}
          </ul>
          {orders.length > 30 && <p className="small muted">Showing the 30 latest of {orders.length.toLocaleString("en-NG")} sales. Each event&rsquo;s guest list download has all of them.</p>}
        </section>
      )}

      {plans.length > 0 && (
        <section className="stack wallet__sec">
          <h2 className="wallet__h2"><Icon name="add-user" size={20} />RSVP plans</h2>
          <p className="small muted">What you pay Ganor for bigger free RSVP events, by bank transfer.</p>
          <ul className="card wtx">
            {plans.map((e) => {
              const plan = planById(e.rsvp_plan)
              return (
                <li key={e.id}>
                  <span className={`wtx__ic${e.plan_paid_at ? "" : " wtx__ic--warn"}`} aria-hidden="true"><Icon name={e.plan_paid_at ? "check-circle" : "clock"} size={18} /></span>
                  <span className="wtx__main">
                    <b><Link href={`/dashboard/events/${e.id}`}>{e.title}</Link></b>
                    <small>{plan.name} plan · up to {plan.cap.toLocaleString("en-NG")} guests · ref {e.id.slice(0, 8).toUpperCase()}</small>
                  </span>
                  <span className="wtx__amt">
                    <b>{nairaPlan(plan.price)}</b>
                    <small>{e.plan_paid_at ? `Paid ${formatDate(e.plan_paid_at, { day: "numeric", month: "short" })}` : "Not paid yet"}</small>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
