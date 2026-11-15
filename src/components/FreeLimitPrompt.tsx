import Link from "next/link"
import { Icon } from "@/components/Icon"
import { RSVP_PLANS, naira } from "@/lib/plans"
import { resetsLabel, type FreeAllowance } from "@/lib/free-limit"

// Shown instead of the New free event form when the host has no free RSVP event available.
export function FreeLimitPrompt({ allowance }: { allowance: FreeAllowance }) {
  const running = allowance.active
  return (
    <div className="stack freelimit">
      <div className="alert alert--info" role="status">
        <Icon name="info" />
        <span>
          {running ? (
            <><b>You already have a free event running: {running.title}.</b> Free RSVP events run one at a time, up to {allowance.limit} a month. Choose a plan for this one, or wait until that event ends.</>
          ) : (
            <><b>You&rsquo;ve used your {allowance.limit} free RSVP events this month.</b> Choose a plan for this one, or create a free event again from {resetsLabel(allowance)}.</>
          )}
        </span>
      </div>
      <div className="plans freelimit__plans">
        {RSVP_PLANS.filter((p) => p.price > 0).map((p) => (
          <div key={p.id} className={`plan${p.popular ? " plan--pick" : ""}`}>
            <div className="plan__top"><b>{p.name}</b>{p.popular && <span className="badge badge--ok">Popular</span>}</div>
            <p className="plan__price">{naira(p.price)}<small> per event</small></p>
            <ul>{p.perks.map((k) => <li key={k}><Icon name="check-circle" size={16} />{k}</li>)}</ul>
            <Link className={`btn btn--sm ${p.popular ? "btn--primary" : "btn--ghost btn--plain"}`} href={`/dashboard/events/new?kind=rsvp&plan=${p.id}`}>Choose {p.name}</Link>
          </div>
        ))}
      </div>
      <p className="small muted">
        Paid plans are one payment per event, made when you publish.{" "}
        {running ? <Link href={`/dashboard/events/${running.id}`}>Open {running.title}</Link> : null}
        {running ? " · " : ""}<Link href="/dashboard/events/new?kind=paid">Sell paid tickets instead</Link>
      </p>
    </div>
  )
}
