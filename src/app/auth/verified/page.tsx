import type { Metadata } from "next"
import Link from "next/link"
import { Icon } from "@/components/Icon"

export const metadata: Metadata = { title: "Email verified", robots: { index: false, follow: false } }

export default function Verified() {
  return (
    <div className="wrap--narrow" style={{ maxWidth: 460, paddingTop: "clamp(32px, 8vw, 72px)" }}>
      <div className="card stack verified">
        <span className="verified__ic" aria-hidden="true"><Icon name="check-circle" size={36} /></span>
        <h1 style={{ font: "800 26px/1.15 var(--ganor-font-display)" }}>Your email is verified</h1>
        <p className="muted">Your Ganor host account is ready. Sign in with the email and password you chose to start hosting.</p>
        <Link className="btn btn--primary" href="/login">
          <span>Proceed to sign in</span>
          <span className="btn__arrow" aria-hidden="true"><Icon name="arrow-right" /></span>
        </Link>
      </div>
    </div>
  )
}
