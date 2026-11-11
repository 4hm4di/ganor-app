import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { enabledProviders, PROVIDERS, safeNext } from "@/lib/auth"
import { LoginForm } from "./LoginForm"

export const metadata: Metadata = { title: "Host sign in" }

const ERRORS: Record<string, string> = {
  link: "That link has expired or was already used. Sign in again, or send yourself a new link.",
  provider: "We couldn't connect to that sign-in provider. Try again, or use your email.",
}

const TITLES = {
  signin: ["Sign in to Ganor", "Manage your events, tickets and check-in."],
  signup: ["Create a host account", "Free to start. Free events cost nothing."],
  link: ["Sign in with an email link", "No password needed. We'll email you a one-time link."],
} as const

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; mode?: string }> }) {
  const sp = await searchParams
  const next = safeNext(sp.next)
  const { userId } = await getUserId()
  if (userId) redirect(next)

  const mode = sp.mode === "signup" || sp.mode === "link" ? sp.mode : "signin"
  const enabled = await enabledProviders()
  const providers = PROVIDERS.filter((p) => enabled.includes(p.id)).map(({ id, label }) => ({ id, label }))
  const [title, lede] = TITLES[mode]

  return (
    <div className="wrap--narrow" style={{ maxWidth: 480 }}>
      <div className="pagehead">
        <div>
          <span className="kicker">For hosts</span>
          <h1 style={{ marginTop: 10 }}>{title}</h1>
          <p className="muted">{lede}</p>
        </div>
      </div>
      <div className="card">
        <LoginForm mode={mode} next={next} providers={providers} error={sp.error ? ERRORS[sp.error] ?? ERRORS.link : undefined} />
      </div>
    </div>
  )
}
