"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { sendLoginLink, signInWithPassword, signInWithProvider, signUpWithPassword, type AuthState } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"
import { ProviderLogo } from "@/components/ProviderLogo"

type Mode = "signin" | "signup" | "link"
type Provider = { id: "google" | "azure" | "apple"; label: string }

function Alert({ state }: { state: AuthState }) {
  if (state.status !== "error") return null
  return <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>
}

export function LoginForm({ mode, next, providers, error }: { mode: Mode; next: string; providers: Provider[]; error?: string }) {
  const [signin, signinAction] = useActionState<AuthState, FormData>(signInWithPassword, { status: "idle" })
  const [signup, signupAction] = useActionState<AuthState, FormData>(signUpWithPassword, { status: "idle" })
  const [link, linkAction] = useActionState<AuthState, FormData>(sendLoginLink, { status: "idle" })
  const [showPw, setShowPw] = useState(false)
  const q = (m: Mode) => `/login?mode=${m}${next !== "/dashboard" ? `&next=${encodeURIComponent(next)}` : ""}`

  if (signup.status === "confirm") {
    return (
      <div className="alert alert--ok" role="status"><Icon name="mail" />
        <span>Almost there. We sent a confirmation link to <b>{signup.email}</b>. Open it on this device to finish creating your account.</span>
      </div>
    )
  }
  if (link.status === "sent") {
    return (
      <div className="alert alert--ok" role="status"><Icon name="mail" />
        <span>Check <b>{link.email}</b> for a sign-in link from Ganor. Open it on this device. It works once and expires in an hour.</span>
      </div>
    )
  }

  return (
    <div className="stack">
      {error && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{error}</span></div>}

      {providers.length > 0 && (
        <>
          <div className="oauth">
            {providers.map((p) => (
              <form action={signInWithProvider} key={p.id}>
                <input type="hidden" name="provider" value={p.id} />
                <input type="hidden" name="next" value={next} />
                <button type="submit" className={`oauth__btn oauth__btn--${p.id}`}>
                  <ProviderLogo id={p.id} />
                  <span>Continue with {p.label}</span>
                </button>
              </form>
            ))}
          </div>
          <div className="or" role="separator"><span>or</span></div>
        </>
      )}

      {mode === "signin" && (
        <form action={signinAction} className="stack" noValidate>
          <input type="hidden" name="next" value={next} />
          <Alert state={signin} />
          <label className="field">
            <span className="field__label">Email</span>
            <input type="email" name="email" required autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" defaultValue={signin.email} placeholder="you@example.com" />
          </label>
          <label className="field">
            <span className="field__label field__label--row">
              Password <Link href="/forgot-password" className="small">Forgot password?</Link>
            </span>
            <span className="pw">
              <input type={showPw ? "text" : "password"} name="password" required autoComplete="current-password" enterKeyHint="go" />
              <button type="button" className="pw__toggle" onClick={() => setShowPw((s) => !s)} aria-pressed={showPw}>{showPw ? "Hide" : "Show"}</button>
            </span>
          </label>
          <SubmitButton pendingText="Signing in…" block>Sign in</SubmitButton>
        </form>
      )}

      {mode === "signup" && (
        <form action={signupAction} className="stack" noValidate>
          <input type="hidden" name="next" value={next} />
          <Alert state={signup} />
          <label className="field">
            <span className="field__label">Host name</span>
            <input name="name" required maxLength={80} autoComplete="organization" placeholder="Your name or organisation" />
          </label>
          <label className="field">
            <span className="field__label">Email</span>
            <input type="email" name="email" required autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" defaultValue={signup.email} placeholder="you@example.com" />
          </label>
          <label className="field">
            <span className="field__label">Password <small>(at least 8 characters)</small></span>
            <span className="pw">
              <input type={showPw ? "text" : "password"} name="password" required minLength={8} autoComplete="new-password" enterKeyHint="go" />
              <button type="button" className="pw__toggle" onClick={() => setShowPw((s) => !s)} aria-pressed={showPw}>{showPw ? "Hide" : "Show"}</button>
            </span>
          </label>
          <SubmitButton pendingText="Creating account…" block>Create host account</SubmitButton>
          <p className="small muted">By creating an account you agree to Ganor&rsquo;s <a href="https://ganor.ng/terms.html">Terms</a> and <a href="https://ganor.ng/privacy.html">Privacy policy</a>.</p>
        </form>
      )}

      {mode === "link" && (
        <form action={linkAction} className="stack" noValidate>
          <input type="hidden" name="next" value={next} />
          <Alert state={link} />
          <label className="field">
            <span className="field__label">Email</span>
            <input type="email" name="email" required autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" enterKeyHint="send" defaultValue={link.email} placeholder="you@example.com" />
          </label>
          <SubmitButton pendingText="Sending…" block>Email me a sign-in link</SubmitButton>
        </form>
      )}

      <p className="small muted switch">
        {mode === "signin" && <>New to Ganor? <Link href={q("signup")}>Create a host account</Link> · <Link href={q("link")}>Email me a link instead</Link></>}
        {mode === "signup" && <>Already have an account? <Link href={q("signin")}>Sign in</Link></>}
        {mode === "link" && <>Prefer a password? <Link href={q("signin")}>Sign in</Link> · <Link href={q("signup")}>Create an account</Link></>}
      </p>
    </div>
  )
}
