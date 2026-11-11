"use client"

import { useActionState } from "react"
import { updateProfile, type FormState } from "../actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"

export function ProfileForm({ displayName, phone }: { displayName: string; phone: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, { status: "idle" })
  return (
    <form action={action} className="stack" noValidate>
      {state.status === "error" && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>}
      {state.status === "ok" && <div className="alert alert--ok" role="status"><Icon name="check-circle" /><span>{state.message}</span></div>}
      <label className="field">
        <span className="field__label">Host name</span>
        <input name="display_name" required maxLength={80} defaultValue={state.fields?.display_name ?? displayName} placeholder="Your name or organisation" autoComplete="organization" />
        <span className="field__hint">Shown on your event pages as &ldquo;Hosted by&rdquo;.</span>
      </label>
      <label className="field">
        <span className="field__label">WhatsApp number <small>(private)</small></span>
        <input name="phone" type="tel" inputMode="tel" defaultValue={state.fields?.phone ?? phone} placeholder="0810 330 1999" autoComplete="tel" />
        <span className="field__hint">Only Ganor support sees this, to reach you about payouts and guests.</span>
      </label>
      <div className="actions"><SubmitButton>Save profile</SubmitButton></div>
    </form>
  )
}
