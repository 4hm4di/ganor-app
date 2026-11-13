"use client"

import { useActionState, useState } from "react"
import { changeMyPassword, updateMyProfile, type AdminState } from "../actions"
import { SubmitButton } from "@/components/SubmitButton"
import { PasswordField } from "@/components/PasswordField"

function Msg({ s }: { s: AdminState }) {
  if (!s.message) return null
  return <p className={`small ${s.status === "error" ? "txt-bad" : "txt-ok"}`} role={s.status === "error" ? "alert" : "status"}>{s.message}</p>
}

export function NameForm({ name }: { name: string }) {
  const [state, action] = useActionState<AdminState, FormData>(updateMyProfile, { status: "idle" })
  return (
    <form action={action} className="stack">
      <label className="field"><span className="field__label">Display name</span>
        <input name="display_name" required minLength={2} maxLength={40} defaultValue={name} autoComplete="name" />
        <span className="field__hint">Shown in the HQ header, the team list and the HQ log.</span>
      </label>
      <div><SubmitButton pendingText="Saving…">Save</SubmitButton></div>
      <Msg s={state} />
    </form>
  )
}

export function PasswordForm() {
  const [state, action] = useActionState<AdminState, FormData>(changeMyPassword, { status: "idle" })
  const [pw, setPw] = useState("")
  return (
    <form action={action} className="stack" key={state.status === "ok" ? "done" : "f"} autoComplete="off">
      <PasswordField label="New password" autoComplete="new-password" minLength={10} meter value={pw} onChange={setPw} />
      <PasswordField name="confirm" label="Type it again" autoComplete="new-password" minLength={10} />
      <div><SubmitButton pendingText="Changing…">Change password</SubmitButton></div>
      <Msg s={state} />
    </form>
  )
}
