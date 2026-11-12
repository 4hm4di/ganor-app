"use client"

import { useActionState } from "react"
import { gateLogin, type GateLoginState } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"

export function GateLoginForm() {
  const [state, action] = useActionState<GateLoginState, FormData>(gateLogin, {})
  return (
    <form action={action} className="stack" noValidate>
      {state.error && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.error}</span></div>}
      <label className="field">
        <span className="field__label">Username</span>
        <input name="username" required autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} defaultValue={state.username} placeholder="yourorg.gate1…" />
      </label>
      <label className="field">
        <span className="field__label">Password</span>
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      <SubmitButton block pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  )
}
