import type { Metadata } from "next"
import { EventForm } from "../../EventForm"
import { Icon } from "@/components/Icon"

export const metadata: Metadata = { title: "New event" }

export default function NewEvent() {
  return (
    <div className="wrap--narrow">
      <div className="pagehead">
        <div>
          <span className="kicker"><Icon name="add-circle" size={18} />Host dashboard</span>
          <h1 style={{ marginTop: 10 }}>New event</h1>
          <p className="muted">It stays a draft until you publish it. You&rsquo;ll add tickets next.</p>
        </div>
      </div>
      <div className="card">
        <EventForm mode="create" />
      </div>
    </div>
  )
}
