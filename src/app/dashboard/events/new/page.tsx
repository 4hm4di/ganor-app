import type { Metadata } from "next"
import { EventForm } from "../../EventForm"
import { Icon } from "@/components/Icon"
import { CloseLink } from "@/components/BackLink"
import { ChooseKind } from "./ChooseKind"
import { FREE_RSVP_CAP } from "@/lib/plans"

export const metadata: Metadata = { title: "New event" }

export default async function NewEvent({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams
  if (kind !== "rsvp" && kind !== "paid") return <div className="wrap--narrow" style={{ minHeight: "50vh" }}><ChooseKind /></div>
  const rsvp = kind === "rsvp"
  return (
    <div className="wrap--narrow">
      <div className="pagehead pagehead--task">
        <div>
          <span className="kicker"><Icon name={rsvp ? "users" : "ticket"} size={18} />{rsvp ? "Free RSVP · Free plan" : "Paid tickets"}</span>
          <h1 style={{ marginTop: 10 }}>{rsvp ? "New free event" : "New ticketed event"}</h1>
          <p className="muted">{rsvp ? `It stays a draft until you publish it. Up to ${FREE_RSVP_CAP} guests on the Free plan; you'll pick your RSVP questions next.` : "It stays a draft until you publish it. You'll add ticket types and prices next."}</p>
        </div>
        <CloseLink href="/dashboard/events" label="Cancel and go back to My events" />
      </div>
      <div className="card">
        <EventForm mode="create" kind={rsvp ? "rsvp" : "paid"} />
      </div>
    </div>
  )
}
