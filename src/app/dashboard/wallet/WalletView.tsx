import Link from "next/link"
import { Icon } from "@/components/Icon"
import { Figure } from "@/components/widgets/Figure"
import { WalletCard, type WalletAccount } from "@/components/WalletCard"
import { formatDate, formatTime } from "@/lib/ganor"
import { naira as nairaPlan, planById } from "@/lib/plans"
import type { Earnings } from "@/lib/earnings"
import { SalesList } from "./SalesList"

const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })
const n = (kobo: number) => money.format(Math.round(kobo / 100))

export type PlanRow = { id: string; title: string; rsvp_plan: string; plan_paid_at: string | null }

export function WalletView({ e, account, plans }: { e: Earnings; account: WalletAccount; plans: PlanRow[] }) {
  const byEvent = Object.values(
    e.sales.reduce<Record<string, { id: string; title: string; starts_at: string; tickets: number; sales: number; fees: number; refunds: number; take: number }>>((acc, s) => {
      const row = (acc[s.eventId] ??= { id: s.eventId, title: s.event, starts_at: s.startsAt, tickets: 0, sales: 0, fees: 0, refunds: 0, take: 0 })
      if (s.refunded) row.refunds += s.share
      else { row.tickets += s.count; row.sales += s.paid; row.fees += s.fee; row.take += s.share }
      return acc
    }, {}),
  ).sort((a, b) => b.take - a.take)

  const tiles = [
    { label: "Paid tickets", value: e.tickets, naira: false, icon: "ticket", tone: "ink", sub: "Sold for money, all time" },
    { label: "Ganor fees", value: Math.round(e.fees / 100), naira: true, icon: "percent", tone: "ink", sub: "6% + ₦100 per paid ticket" },
    { label: "Refunded", value: Math.round(e.refunded / 100), naira: true, icon: "receipt", tone: e.refunded ? "danger" : "ink", sub: e.refunded ? "Taken off your take-home" : "No refunds" },
  ]
  const rejected = account?.status === "rejected"

  return (
    <div className="wrap wallet">
      <div className="pagehead">
        <div>
          <span className="kicker"><Icon name="wallet" size={18} />Wallet</span>
          <h1 style={{ marginTop: 10 }}>Your money</h1>
          <p className="muted">What your paid tickets earned, what Ganor kept, and where your payouts go. Free RSVPs don&rsquo;t pass through your wallet.</p>
        </div>
      </div>

      {(rejected || !account) && (
        <div className={`alert ${rejected ? "alert--error" : "alert--warn"}`} role="status">
          <Icon name={rejected ? "warning" : "wallet"} />
          <span>{rejected ? <><b>Your payout account needs a fix.</b> {account?.status_note ? `Ganor says: ${account.status_note}` : "The details didn't match your bank."}</> : <><b>Add your payout account</b> so your share of each paid ticket has somewhere to settle. Ganor confirms the account name first.</>}</span>
          <Link href="/dashboard/profile#payouts" className="alert__link">{rejected ? "Fix details" : "Add account"}</Link>
        </div>
      )}

      <div className="wallet__hero">
        <WalletCard takeHome={e.takeHome} month={e.month} account={account} manageHref="/dashboard/profile#payouts" />
        <div className="wallet__tiles">
          {tiles.map((t) => (
            <article key={t.label} className={`card astat astat--${t.tone}`} data-reveal>
              <span className="astat__ic" aria-hidden="true"><Icon name={t.icon} size={22} /></span>
              <p className="astat__l">{t.label}</p>
              <p className="astat__v"><Figure value={t.value} naira={t.naira} /></p>
              <p className="astat__s">{t.sub}</p>
            </article>
          ))}
        </div>
      </div>

      <article className="card wallet__how" data-reveal>
        <h2 className="wallet__h2"><Icon name="route" size={20} />How you get paid</h2>
        <ol className="wallet__steps">
          <li><span className="wallet__step" aria-hidden="true"><Icon name="ticket" size={18} /></span><span><b>A guest pays</b><small>By card, bank transfer or USSD at checkout.</small></span></li>
          <li><span className="wallet__step" aria-hidden="true"><Icon name="percent" size={18} /></span><span><b>The sale is split</b><small>Paystack splits each payment: the Ganor fee to Ganor, the rest to you.</small></span></li>
          <li><span className="wallet__step" aria-hidden="true"><Icon name="wallet" size={18} /></span><span><b>Your share settles to your bank</b><small>Straight to the payout account on your card. Nothing to request.</small></span></li>
        </ol>
      </article>

      <section className="stack wallet__sec">
        <h2 className="wallet__h2"><Icon name="calendar" size={20} />By event</h2>
        {byEvent.length === 0 ? (
          <div className="card wallet__empty" data-reveal>
            <Icon name="ticket" size={28} />
            <div><b>No paid sales yet.</b><p className="muted small">When guests buy paid tickets, each event&rsquo;s sales, fees and take-home show here.</p></div>
            <Link href="/dashboard/events/new" className="btn btn--primary btn--sm"><span>New event</span><span className="btn__arrow" aria-hidden="true"><Icon name="add-circle" /></span></Link>
          </div>
        ) : (
          <div className="card wtable__wrap" data-reveal>
            <table className="wtable">
              <thead><tr><th scope="col">Event</th><th scope="col">Paid tickets</th><th scope="col">Guests paid</th><th scope="col">Ganor fee</th><th scope="col">Refunds</th><th scope="col">Your take-home</th></tr></thead>
              <tbody>
                {byEvent.map((r) => (
                  <tr key={r.id}>
                    <th scope="row"><Link href={`/dashboard/events/${r.id}`}>{r.title}</Link><small>{formatDate(r.starts_at, { day: "numeric", month: "short", year: "numeric" })}</small></th>
                    <td data-l="Paid tickets">{r.tickets.toLocaleString("en-NG")}</td>
                    <td data-l="Guests paid">{n(r.sales)}</td>
                    <td data-l="Ganor fee">{n(r.fees)}</td>
                    <td data-l="Refunds">{r.refunds ? `−${n(r.refunds)}` : "₦0"}</td>
                    <td data-l="Your take-home"><b>{n(r.take)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {e.sales.length > 0 && (
        <section className="stack wallet__sec">
          <h2 className="wallet__h2"><Icon name="receipt" size={20} />Recent sales</h2>
          <SalesList rows={e.sales.slice(0, 100).map((s) => ({
            id: s.id,
            buyer: s.buyer,
            line: `${s.event} · ${s.count} ${s.count === 1 ? "ticket" : "tickets"} · ${formatDate(s.at, { day: "numeric", month: "short" })}, ${formatTime(s.at)}`,
            amount: s.refunded ? `−${n(s.share)}` : `+${n(s.share)}`,
            sub: s.refunded ? "Refunded" : `Paid ${n(s.paid)}`,
            refunded: s.refunded,
          }))} />
          {e.sales.length > 100 && <p className="small muted">The 100 latest of {e.sales.length.toLocaleString("en-NG")} sales are here. Each event&rsquo;s guest list download has all of them.</p>}
        </section>
      )}

      {plans.length > 0 && (
        <section className="stack wallet__sec">
          <h2 className="wallet__h2"><Icon name="add-user" size={20} />RSVP plans</h2>
          <p className="small muted">What you pay Ganor for bigger free RSVP events, by bank transfer.</p>
          <ul className="card wtx" data-reveal>
            {plans.map((p) => {
              const plan = planById(p.rsvp_plan)
              return (
                <li key={p.id}>
                  <span className={`wtx__ic${p.plan_paid_at ? "" : " wtx__ic--warn"}`} aria-hidden="true"><Icon name={p.plan_paid_at ? "check-circle" : "clock"} size={18} /></span>
                  <span className="wtx__main">
                    <b><Link href={`/dashboard/events/${p.id}`}>{p.title}</Link></b>
                    <small>{plan.name} plan · up to {plan.cap.toLocaleString("en-NG")} guests · ref {p.id.slice(0, 8).toUpperCase()}</small>
                  </span>
                  <span className="wtx__amt"><b>{nairaPlan(plan.price)}</b><small>{p.plan_paid_at ? `Paid ${formatDate(p.plan_paid_at, { day: "numeric", month: "short" })}` : "Not paid yet"}</small></span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
