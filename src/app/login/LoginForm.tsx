"use client"

import Link from "next/link"
import { useActionState, useRef, useState } from "react"
import { sendLoginLink, signInWithPassword, signInWithProvider, signUpWithPassword, type AuthState } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Loader } from "@/components/Loader"
import { useFormStatus } from "react-dom"
import { Icon } from "@/components/Icon"
import { ProviderLogo } from "@/components/ProviderLogo"
import { PasswordField } from "@/components/PasswordField"
import { PRIVACY_URL, TERMS_URL } from "@/lib/terms"
import { hapticError } from "@/lib/haptics"

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
  // Sign-up needs the Terms box ticked, for Google and for email alike.
  const [agreed, setAgreed] = useState(false)
  const [nudge, setNudge] = useState(0)
  const agreeRef = useRef<HTMLInputElement>(null)
  const agreeBox = useRef<HTMLDivElement>(null)
  const needAgree = (e: React.FormEvent) => {
    if (mode !== "signup" || agreed) return
    e.preventDefault()
    setNudge((n) => n + 1)
    hapticError()
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      agreeBox.current?.animate([{ transform: "none" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(-3px)" }, { transform: "none" }], { duration: 320, easing: "ease-in-out" })
    }
    agreeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" })
    agreeRef.current?.focus({ preventScroll: true })
  }
  const q = (m: Mode) => `/login?mode=${m}${next !== "/dashboard" ? `&next=${encodeURIComponent(next)}` : ""}`

  if (signup.status === "confirm") {
    return (
      <div className="alert alert--ok" role="status"><Icon name="mail" />
        <span>Almost there. We sent a confirmation link to <b>{signup.email}</b>. Open it to verify your email, then sign in.</span>
      </div>
    )
  }
  if (signup.status === "exists") {
    return (
      <div className="stack">
        <div className="alert alert--warn" role="status"><Icon name="info" />
          <span>There&rsquo;s already a Ganor account with <b>{signup.email}</b>. Sign in, or reset your password if you&rsquo;ve forgotten it.</span>
        </div>
        <div className="grid2">
          <Link href={q("signin")} className="btn btn--primary btn--plain" style={{ justifyContent: "center" }}>Sign in</Link>
          <Link href="/forgot-password" className="btn btn--ghost btn--plain" style={{ justifyContent: "center" }}>Forgot password</Link>
        </div>
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
              <form action={signInWithProvider} key={p.id} onSubmit={needAgree}>
                <input type="hidden" name="provider" value={p.id} />
                <input type="hidden" name="next" value={next} />
                <input type="hidden" name="intent" value={mode === "signup" ? "signup" : "signin"} />
                {mode === "signup" && <input type="hidden" name="agree" value={agreed ? "1" : ""} />}
                <ProviderButton id={p.id} label={p.label} />
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
          <PasswordField enterKeyHint="go" labelExtra={<Link href="/forgot-password" className="small">Forgot password?</Link>} />
          <SubmitButton pendingText="Signing in…" block>Sign in</SubmitButton>
        </form>
      )}

      {mode === "signup" && (
        <form action={signupAction} className="stack" noValidate onSubmit={needAgree}>
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
          <PasswordField autoComplete="new-password" minLength={8} meter enterKeyHint="go" />
          <div ref={agreeBox} className={`agree${nudge && !agreed ? " agree--nudge" : ""}`}>
            <label className="checkrow">
              <input ref={agreeRef} type="checkbox" name="agree" value="1" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} aria-describedby={nudge && !agreed ? "agree-msg" : undefined} aria-invalid={nudge > 0 && !agreed} />
              <span>I agree to Ganor&rsquo;s <a href={TERMS_URL} target="_blank" rel="noopener">Terms</a> and <a href={PRIVACY_URL} target="_blank" rel="noopener">Privacy policy</a>.</span>
            </label>
            {nudge > 0 && !agreed && <p id="agree-msg" className="agree__msg" role="alert"><Icon name="warning" size={16} />Tick this box to create your account.</p>}
          </div>
          <SubmitButton pendingText="Creating account…" block>Create host account</SubmitButton>
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

      <p className="authswitch">
        {mode === "signin" && <><span>New to Ganor? <Link href={q("signup")}>Create a host account</Link></span><span aria-hidden="true">·</span><Link href={q("link")}>Email me a link instead</Link></>}
        {mode === "signup" && <>Already have an account? <Link href={q("signin")}>Sign in</Link></>}
        {mode === "link" && <>Prefer a password? <Link href={q("signin")}>Sign in</Link> · <Link href={q("signup")}>Create an account</Link></>}
      </p>
    </div>
  )
}

// Shows the Ganor loader in place of the provider logo while we hand off to Google, Microsoft or Apple.
function ProviderButton({ id, label }: Provider) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={`oauth__btn oauth__btn--${id}`} disabled={pending} aria-busy={pending}>
      {pending ? <Loader size={22} /> : <ProviderLogo id={id} />}
      <span>{pending ? `Opening ${label}…` : `Continue with ${label}`}</span>
    </button>
  )
}
