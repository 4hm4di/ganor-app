"use client"

import { useActionState } from "react"
import { updateProfile, type FormState } from "../actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"

type Values = {
  display_name: string
  bio: string
  contact_whatsapp: string
  contact_email: string
  website: string
  instagram: string
  phone: string
}

export function ProfileForm({ initial }: { initial: Values }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, { status: "idle" })
  const v = { ...initial, ...(state.fields ?? {}) } as Values
  const key = state.fields ? JSON.stringify(state.fields) : "init"
  return (
    <form action={action} className="stack" key={key} noValidate>
      {state.status === "error" && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>}
      {state.status === "ok" && <div className="alert alert--ok" role="status"><Icon name="check-circle" /><span>{state.message}</span></div>}

      <label className="field">
        <span className="field__label">Host name</span>
        <input name="display_name" required maxLength={80} defaultValue={v.display_name} placeholder="Your name or organisation" autoComplete="organization" />
        <span className="field__hint">Shown on your event pages as &ldquo;Hosted by&rdquo;.</span>
      </label>
      <label className="field">
        <span className="field__label">About you <small>(optional, 280 characters)</small></span>
        <textarea name="bio" maxLength={280} defaultValue={v.bio} style={{ minHeight: 90 }} placeholder="Who you are and the events you run…" />
      </label>

      <div>
        <span className="kicker"><Icon name="chat" size={16} />Contact for guests</span>
        <p className="field__hint" style={{ marginTop: 6 }}>Shown on your event pages so guests can reach you about the event. Leave any of them empty to hide it.</p>
      </div>
      <div className="grid2">
        <label className="field">
          <span className="field__label">WhatsApp</span>
          <input name="contact_whatsapp" type="tel" inputMode="tel" defaultValue={v.contact_whatsapp} placeholder="0803 000 0000" autoComplete="tel" />
        </label>
        <label className="field">
          <span className="field__label">Email</span>
          <input name="contact_email" type="email" inputMode="email" autoCapitalize="none" spellCheck={false} autoComplete="email" defaultValue={v.contact_email} placeholder="events@yourorg.ng" />
        </label>
      </div>
      <div className="grid2">
        <label className="field">
          <span className="field__label">Website</span>
          <input name="website" inputMode="url" autoCapitalize="none" spellCheck={false} autoComplete="url" defaultValue={v.website} placeholder="yourorg.ng" />
        </label>
        <label className="field">
          <span className="field__label">Instagram</span>
          <input name="instagram" autoCapitalize="none" spellCheck={false} autoComplete="off" defaultValue={v.instagram} placeholder="@yourorg" />
        </label>
      </div>

      <div>
        <span className="kicker"><Icon name="lock" size={16} />Private</span>
      </div>
      <label className="field">
        <span className="field__label">Your phone number <small>(private)</small></span>
        <input name="phone" type="tel" inputMode="tel" defaultValue={v.phone} placeholder="0803 000 0000" autoComplete="tel" />
        <span className="field__hint">Only Ganor support sees this, to reach you about payouts.</span>
      </label>
      <div className="actions"><SubmitButton>Save profile</SubmitButton></div>
    </form>
  )
}
