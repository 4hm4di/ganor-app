"use client"

import { useActionState } from "react"
import { sendLoginLink, type LoginState } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"

export function LoginForm({ next, error }: { next: string; error?: string }) {
  const [state, action] = useActionState<LoginState, FormData>(sendLoginLink, { status: "idle" })

  if (state.status === "sent") {
    return (
      <div className="alert alert--ok" role="status">
        <Icon name="mail" />
        <span>
          Check <b>{state.email}</b> for a sign-in link from Ganor. Open it on this device. It works once and expires in an hour.
        </span>
      </div>
    )
  }

  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="next" value={next} />
      {error && (
        <div className="alert alert--error" role="alert">
          <Icon name="warning" />
          <span>{error}</span>
        </div>
      )}
      {state.status === "error" && (
        <div className="alert alert--error" role="alert">
          <Icon name="warning" />
          <span>{state.message}</span>
        </div>
      )}
      <label className="field">
        <span className="field__label">Email</span>
        <input type="email" name="email" required autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" enterKeyHint="send" defaultValue={state.email} placeholder="you@example.com" />
      </label>
      <SubmitButton pendingText="Sending…" block>Email me a sign-in link</SubmitButton>
      <p className="small muted">No password needed. New here? The same link creates your host account.</p>
    </form>
  )
}
