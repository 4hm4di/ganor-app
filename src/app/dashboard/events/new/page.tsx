import type { Metadata } from "next"
import { EventForm } from "../../EventForm"
import { Icon } from "@/components/Icon"
import { CloseLink } from "@/components/BackLink"
import { ChooseKind } from "./ChooseKind"
import { planById, naira } from "@/lib/plans"
import { createClient } from "@/lib/supabase/server"
import { FreeLimitPrompt } from "@/components/FreeLimitPrompt"
import { freeLeftLabel, type FreeAllowance } from "@/lib/free-limit"

export const metadata: Metadata = { title: "New event" }

export default async function NewEvent({ searchParams }: { searchParams: Promise<{ kind?: string; plan?: string }> }) {
  const { kind, plan: planId } = await searchParams
  if (kind !== "rsvp" && kind !== "paid") return <div className="wrap--narrow" style={{ minHeight: "50vh" }}><ChooseKind /></div>
  const rsvp = kind === "rsvp"
  const plan = planById(planId)
  let allowance: FreeAllowance | null = null
  if (rsvp && plan.price === 0) {
    const supabase = await createClient()
    const { data } = await supabase.rpc("free_rsvp_allowance")
    allowance = (data as FreeAllowance | null) ?? null
  }
  const blocked = Boolean(allowance && !allowance.can_create)
  return (
    <div className="wrap--narrow">
      <div className="pagehead pagehead--task">
        <div>
          <span className="kicker"><Icon name={rsvp ? "users" : "ticket"} size={18} />{rsvp ? `RSVP · ${plan.name} plan${plan.price ? ` · ${naira(plan.price)}` : ""}` : "Paid tickets"}</span>
          <h1 style={{ marginTop: 10 }}>{blocked ? "Choose a plan for this event" : rsvp ? "New free event" : "New ticketed event"}</h1>
          <p className="muted">{blocked ? "Your free RSVP event isn't available right now." : rsvp ? `Up to ${plan.cap.toLocaleString("en-NG")} guests and ${plan.questions} questions. ${plan.price ? `It stays a draft while you set it up; you pay ${naira(plan.price)} when you publish.` : "No payment needed. It stays a draft until you publish it."}` : "It stays a draft until you publish it. You'll add ticket types and prices next."}</p>
        </div>
        <CloseLink href="/dashboard/events" label="Cancel and go back to My events" />
      </div>
      {allowance && !blocked && <p className="small muted" style={{ marginBottom: 12 }}><span className="badge badge--ok">{freeLeftLabel(allowance)}</span> Free events run one at a time.</p>}
      {blocked && allowance ? <FreeLimitPrompt allowance={allowance} /> : <div className="card">
        <EventForm mode="create" kind={rsvp ? "rsvp" : "paid"} plan={rsvp ? plan.id : undefined} />
      </div>}
    </div>
  )
}
