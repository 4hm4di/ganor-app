"use client"

import { useActionState } from "react"
import { setNewPassword, type AuthState } from "../login/actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"

export function ResetForm() {
  const [state, action] = useActionState<AuthState, FormData>(setNewPassword, { status: "idle" })
  return (
    <form action={action} className="stack" noValidate>
      {state.status === "error" && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>}
      <label className="field">
        <span className="field__label">New password</span>
        <input type="password" name="password" required minLength={8} autoComplete="new-password" />
      </label>
      <label className="field">
        <span className="field__label">Type it again</span>
        <input type="password" name="confirm" required minLength={8} autoComplete="new-password" enterKeyHint="go" />
      </label>
      <SubmitButton pendingText="Saving…" block>Save new password</SubmitButton>
    </form>
  )
}
