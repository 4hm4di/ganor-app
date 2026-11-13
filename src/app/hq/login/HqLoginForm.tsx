"use client"

import { useActionState } from "react"
import { hqLogin, type HqLoginState } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"
import { PasswordField } from "@/components/PasswordField"

export function HqLoginForm() {
  const [state, action] = useActionState<HqLoginState, FormData>(hqLogin, {})
  return (
    <form action={action} className="stack" noValidate>
      {state.error && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.error}</span></div>}
      <label className="field"><span className="field__label">Username or email</span>
        <input type="text" name="email" required autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} defaultValue={state.email} />
      </label>
      <PasswordField enterKeyHint="go" />
      <SubmitButton block pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  )
}
