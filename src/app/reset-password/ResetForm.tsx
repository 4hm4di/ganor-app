"use client"

import { useActionState } from "react"
import { setNewPassword, type AuthState } from "../login/actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"
import { PasswordField } from "@/components/PasswordField"

export function ResetForm() {
  const [state, action] = useActionState<AuthState, FormData>(setNewPassword, { status: "idle" })
  return (
    <form action={action} className="stack" noValidate>
      {state.status === "error" && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>}
      <PasswordField label="New password" autoComplete="new-password" minLength={8} meter />
      <PasswordField name="confirm" label="Type it again" autoComplete="new-password" minLength={8} enterKeyHint="go" />
      <SubmitButton pendingText="Saving…" block>Save new password</SubmitButton>
    </form>
  )
}
