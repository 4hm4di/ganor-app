import type { Metadata } from "next"
import { confirmEmailLink } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"

export const metadata: Metadata = { title: "Confirm", robots: { index: false, follow: false } }

const COPY: Record<string, { title: string; body: string; button: string }> = {
  email_change: { title: "Confirm your new email", body: "Press the button to finish moving your Ganor sign-in to this address.", button: "Confirm email change" },
  signup: { title: "Confirm your email", body: "Press the button to finish creating your Ganor host account.", button: "Confirm my email" },
  recovery: { title: "Reset your password", body: "Press the button, then choose a new password.", button: "Continue" },
  magiclink: { title: "Sign in to Ganor", body: "Press the button to sign in on this device.", button: "Sign me in" },
  invite: { title: "Join Ganor", body: "Press the button to accept the invitation.", button: "Accept" },
  email: { title: "Sign in to Ganor", body: "Press the button to sign in on this device.", button: "Sign me in" },
}

export default async function Confirm({ searchParams }: { searchParams: Promise<{ token_hash?: string; type?: string; next?: string }> }) {
  const { token_hash = "", type = "", next = "/dashboard" } = await searchParams
  const c = COPY[type]
  return (
    <div className="wrap--narrow" style={{ maxWidth: 460, paddingTop: "clamp(32px, 8vw, 72px)" }}>
      <div className="card stack">
        {!c || !token_hash ? (
          <>
            <h1 style={{ font: "800 26px/1.15 var(--ganor-font-display)" }}>This link is incomplete</h1>
            <p className="muted">Open the newest email from Ganor and use its button. If it still fails, start again from the sign-in page.</p>
            <a className="btn btn--primary btn--plain" href="/login">Go to sign in</a>
          </>
        ) : (
          <form action={confirmEmailLink} className="stack">
            <span className="kicker"><Icon name="mail" size={16} />Ganor</span>
            <h1 style={{ font: "800 26px/1.15 var(--ganor-font-display)" }}>{c.title}</h1>
            <p className="muted">{c.body}</p>
            <input type="hidden" name="token_hash" value={token_hash} />
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="next" value={next} />
            <SubmitButton block pendingText="Confirming…">{c.button}</SubmitButton>
          </form>
        )}
      </div>
    </div>
  )
}
