import type { Metadata } from "next"
import { EventForm } from "../../EventForm"
import { Icon } from "@/components/Icon"
import { CloseLink } from "@/components/BackLink"

export const metadata: Metadata = { title: "New event" }

export default function NewEvent() {
  return (
    <div className="wrap--narrow">
      <div className="pagehead pagehead--task">
        <div>
          <span className="kicker"><Icon name="add-circle" size={18} />Host dashboard</span>
          <h1 style={{ marginTop: 10 }}>New event</h1>
          <p className="muted">It stays a draft until you publish it. You&rsquo;ll add tickets next.</p>
        </div>
        <CloseLink href="/dashboard/events" label="Cancel and go back to My events" />
      </div>
      <div className="card">
        <EventForm mode="create" />
      </div>
    </div>
  )
}
