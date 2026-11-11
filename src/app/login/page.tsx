import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { LoginForm } from "./LoginForm"

export const metadata: Metadata = { title: "Host sign in" }

const ERRORS: Record<string, string> = {
  link: "That sign-in link has expired or was already used. Send yourself a new one.",
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams
  const { userId } = await getUserId()
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"
  if (userId) redirect(dest)

  return (
    <div className="wrap--narrow" style={{ maxWidth: 480 }}>
      <div className="pagehead">
        <div>
          <span className="kicker">For hosts</span>
          <h1 style={{ marginTop: 10 }}>Sign in to Ganor</h1>
          <p className="muted">Create events, add ticket types and share one link.</p>
        </div>
      </div>
      <div className="card">
        <LoginForm next={dest} error={error ? ERRORS[error] ?? ERRORS.link : undefined} />
      </div>
    </div>
  )
}
