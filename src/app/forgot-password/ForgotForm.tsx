"use client"

import Link from "next/link"
import { useActionState } from "react"
import { sendPasswordReset, type AuthState } from "../login/actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"

export function ForgotForm() {
  const [state, action] = useActionState<AuthState, FormData>(sendPasswordReset, { status: "idle" })
  if (state.status === "sent") {
    return (
      <div className="alert alert--ok" role="status"><Icon name="mail" />
        <span>If there&rsquo;s a Ganor account for <b>{state.email}</b>, a reset link is on its way. Open it on this device.</span>
      </div>
    )
  }
  return (
    <form action={action} className="stack" noValidate>
      {state.status === "error" && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>}
      <label className="field">
        <span className="field__label">Email</span>
        <input type="email" name="email" required autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" enterKeyHint="send" defaultValue={state.email} placeholder="you@example.com" />
      </label>
      <SubmitButton pendingText="Sending…" block>Send reset link</SubmitButton>
      <p className="small muted switch"><Link href="/login">Back to sign in</Link></p>
    </form>
  )
}
