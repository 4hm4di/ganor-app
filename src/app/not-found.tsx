import type { Metadata } from "next"
import Link from "next/link"
import { Icon } from "@/components/Icon"

export const metadata: Metadata = { title: "Page not found", robots: { index: false } }

export default function NotFound() {
  return (
    <div className="wrap nf">
      <div className="nf__ticket" aria-hidden="true">
        <span className="nf__code">404</span>
        <span className="nf__stub"><Icon name="ticket" size={28} /></span>
      </div>
      <div className="nf__text">
        <span className="kicker">Page not found</span>
        <h1>This ticket doesn&rsquo;t scan.</h1>
        <p className="muted">The page may have moved, the event may have been taken down, or the link has a typo.</p>
        <div className="nf__actions">
          <Link href="/events" className="btn btn--primary"><span>Find events</span><span className="btn__arrow" aria-hidden="true"><Icon name="arrow" /></span></Link>
          <a href="/" className="btn btn--ghost btn--plain">Ganor homepage</a>
        </div>
      </div>
    </div>
  )
}
