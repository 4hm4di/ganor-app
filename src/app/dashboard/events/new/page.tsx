import type { Metadata } from "next"
import Link from "next/link"
import { EventForm } from "../../EventForm"
import { Icon } from "@/components/Icon"

export const metadata: Metadata = { title: "New event" }

export default function NewEvent() {
  return (
    <div className="wrap--narrow">
      <div className="pagehead">
        <div>
          <Link href="/dashboard" className="crumb"><Icon name="arrow-right" size={16} />My events</Link>
          <h1>New event</h1>
          <p className="muted">It stays a draft until you publish it. You&rsquo;ll add tickets next.</p>
        </div>
      </div>
      <div className="card">
        <EventForm mode="create" />
      </div>
    </div>
  )
}
