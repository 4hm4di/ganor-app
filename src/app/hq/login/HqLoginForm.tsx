"use client"

import { useActionState } from "react"
import { hqLogin, type HqLoginState } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"

export function HqLoginForm() {
  const [state, action] = useActionState<HqLoginState, FormData>(hqLogin, {})
  return (
    <form action={action} className="stack" noValidate>
      {state.error && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.error}</span></div>}
      <label className="field"><span className="field__label">Email</span>
        <input type="email" name="email" required autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} defaultValue={state.email} />
      </label>
      <label className="field"><span className="field__label">Password</span>
        <input type="password" name="password" required autoComplete="current-password" />
      </label>
      <SubmitButton block pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  )
}
