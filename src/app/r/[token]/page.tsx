import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Icon } from "@/components/Icon"
import { formatDate } from "@/lib/ganor"
import { RatingForm } from "./RatingForm"

export const metadata: Metadata = {
  title: "Rate your event",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

type Invite = {
  event_title: string
  event_slug: string
  starts_at: string
  venue: string
  city: string
  host_name: string
  host_logo: string | null
  first_name: string
  attended: boolean
  expires_at: string
  state: "open" | "closed" | "revoked"
  review: { rating: number; comment: string; display_mode: "initial" | "anonymous"; publish_at: string; status: string } | null
}

// Read-only. WhatsApp fetches this URL to build the link preview, so nothing here may change data.
export default async function RatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data } = await supabase.rpc("rating_invite", { p_token: token })
  const inv = data as Invite | null

  if (!inv) {
    return (
      <div className="wrap--narrow">
        <div className="card stack">
          <span className="kicker"><Icon name="warning" size={18} />Rating link</span>
          <h1>This link isn&rsquo;t valid</h1>
          <p className="muted">It may have been mistyped, or replaced by a newer link. Ask Ganor support at <a href="mailto:support@ganor.ng">support@ganor.ng</a> for a fresh one.</p>
        </div>
      </div>
    )
  }

  const closed = inv.state !== "open"
  return (
    <div className="wrap--narrow">
      <div className="pagehead" data-hero>
        <div>
          <span className="kicker" data-rise><Icon name="star" size={18} />{inv.attended ? "Verified attendee" : "Ticket holder"}</span>
          <h1 style={{ marginTop: 10 }} data-lines><span className="line"><span>How was {inv.event_title}?</span></span></h1>
          <p className="muted" data-rise>{formatDate(inv.starts_at)} · {inv.venue}, {inv.city} · hosted by {inv.host_name}</p>
        </div>
      </div>
      <div className="card" data-reveal>
        {closed ? (
          <div className="stack">
            <p>{inv.state === "revoked" ? "This rating link no longer works because the order was refunded or cancelled." : `Ratings for this event closed on ${formatDate(inv.expires_at)}.`}</p>
            <Link href={`/e/${inv.event_slug}`} className="btn btn--ghost btn--sm btn--plain" style={{ justifySelf: "start" }}>See the event</Link>
          </div>
        ) : (
          <RatingForm token={token} firstName={inv.first_name} host={inv.host_name} attended={inv.attended} expires={formatDate(inv.expires_at)} existing={inv.review} />
        )}
      </div>
    </div>
  )
}
