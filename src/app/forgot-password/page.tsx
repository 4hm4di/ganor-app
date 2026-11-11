import type { Metadata } from "next"
import { ForgotForm } from "./ForgotForm"

export const metadata: Metadata = { title: "Reset your password" }

export default function ForgotPassword() {
  return (
    <div className="wrap--narrow" style={{ maxWidth: 480 }}>
      <div className="pagehead">
        <div>
          <span className="kicker">For hosts</span>
          <h1 style={{ marginTop: 10 }}>Reset your password</h1>
          <p className="muted">Enter your email and we&rsquo;ll send you a link to choose a new one.</p>
        </div>
      </div>
      <div className="card"><ForgotForm /></div>
    </div>
  )
}
