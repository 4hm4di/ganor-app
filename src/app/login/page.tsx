import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { enabledProviders, PROVIDERS, safeNext } from "@/lib/auth"
import { Icon } from "@/components/Icon"
import { IDLE_MINUTES } from "@/lib/session"
import { LoginForm } from "./LoginForm"

export const metadata: Metadata = { title: "Host sign in" }

const ERRORS: Record<string, string> = {
  link: "That link has expired or was already used. Sign in again, or send yourself a new link.",
  email: "That email-change link has expired or was already used. Sign in and start the change again from your profile.",
  provider: "We couldn't connect to that sign-in provider. Try again, or use your email.",
}

const TITLES = {
  signin: ["Sign in to Ganor", "Manage your events, tickets and check-in."],
  signup: ["Create a host account", "Free to start. Free events cost nothing."],
  link: ["Sign in with an email link", "No password needed. We'll email you a one-time link."],
} as const

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; mode?: string; expired?: string; signed_out?: string }> }) {
  const sp = await searchParams
  const next = safeNext(sp.next)
  const { userId } = await getUserId()
  if (userId) redirect(next)

  const mode = sp.mode === "signup" || sp.mode === "link" ? sp.mode : "signin"
  const enabled = await enabledProviders()
  const providers = PROVIDERS.filter((p) => enabled.includes(p.id)).map(({ id, label }) => ({ id, label }))
  const [title, lede] = TITLES[mode]

  return (
    <div className="authpage wrap">
      <aside className="authpage__brand" aria-hidden="true">
        <span className="kicker kicker--light">Ganor for hosts</span>
        <p className="authpage__big">Sell tickets, take RSVPs and check guests in, all from your phone.</p>
        <ul className="authpage__list">
          <li><Icon name="ticket" size={18} />Paid tickets and free RSVPs</li>
          <li><Icon name="qr-code" size={18} />Gate scanner for your team</li>
          <li><Icon name="wallet" size={18} />Payouts straight to your bank</li>
        </ul>
      </aside>
      <div className="authpage__form">
      <a href="/" className="authback"><Icon name="arrow-right" size={16} />Back to homepage</a>
      <div className="pagehead" data-hero key={mode}>
        <div>
          <span className="kicker" data-rise>For hosts</span>
          <h1 style={{ marginTop: 10 }} data-lines><span className="line"><span>{title}</span></span></h1>
          <p className="muted" data-rise>{lede}</p>
        </div>
      </div>
      {sp.expired && <div className="alert alert--ok" role="status" style={{ marginBottom: 14 }}><Icon name="clock" /><span>You were signed out after {IDLE_MINUTES} minutes without activity. Sign in again to continue.</span></div>}
      {sp.signed_out && <div className="alert alert--ok" role="status" style={{ marginBottom: 14 }}><Icon name="check-circle" /><span>You&rsquo;re signed out.</span></div>}
      <div className="card" data-reveal>
        <LoginForm mode={mode} next={next} providers={providers} error={sp.error ? ERRORS[sp.error] ?? ERRORS.link : undefined} />
      </div>
      </div>
    </div>
  )
}
