"use client"

import { useActionState } from "react"
import { changeEmail, type FormState } from "../actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"

export function EmailForm({ current }: { current: string }) {
  const [state, action] = useActionState<FormState, FormData>(changeEmail, { status: "idle" })
  return (
    <form action={action} className="stack" noValidate>
      <div>
        <span className="kicker"><Icon name="mail" size={16} />Sign-in email</span>
        <p className="field__hint" style={{ marginTop: 6 }}>The address you sign in with. Guests don&rsquo;t see it. Currently <strong>{current}</strong>.</p>
      </div>
      {state.status === "error" && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>}
      {state.status === "ok" && <div className="alert alert--ok" role="status"><Icon name="check-circle" /><span>{state.message}</span></div>}
      <label className="field">
        <span className="field__label">New email</span>
        <input type="email" name="email" required inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} defaultValue={state.fields?.email ?? ""} placeholder="you@example.com" />
      </label>
      <div><SubmitButton pendingText="Sending link…">Change email</SubmitButton></div>
    </form>
  )
}
