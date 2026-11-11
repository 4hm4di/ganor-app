"use client"

import { useActionState } from "react"
import { createEvent, updateEvent, type FormState } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"
import { CATEGORIES, CITIES } from "@/lib/ganor"

type Values = {
  id?: string
  title: string
  category: string
  city: string
  venue_name: string
  venue_address: string
  starts_at: string
  ends_at: string
  description: string
  halal_friendly: boolean
}

export function EventForm({ initial, mode }: { initial?: Values; mode: "create" | "edit" }) {
  const [state, action] = useActionState<FormState, FormData>(mode === "create" ? createEvent : updateEvent, { status: "idle" })
  const v = { ...initial, ...(state.fields ?? {}) } as Partial<Record<keyof Values, string | boolean>>
  const halal = state.fields ? state.fields.halal_friendly === "on" : Boolean(initial?.halal_friendly)
  // Re-mount fields with the submitted values after a validation error, so nothing typed is lost.
  const key = state.fields ? JSON.stringify(state.fields) : "init"

  return (
    <form action={action} className="stack" key={key} noValidate>
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      {state.status === "error" && (
        <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>
      )}
      {state.status === "ok" && (
        <div className="alert alert--ok" role="status"><Icon name="check-circle" /><span>{state.message}</span></div>
      )}

      <label className="field">
        <span className="field__label">Event name</span>
        <input name="title" required maxLength={120} defaultValue={String(v.title ?? "")} placeholder="Kano Halal Trade Fair 2026" />
      </label>

      <div className="grid2">
        <label className="field">
          <span className="field__label">Event type</span>
          <select name="category" required defaultValue={String(v.category ?? "")}>
            <option value="" disabled>Choose one</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field__label">City</span>
          <input name="city" required list="ganor-cities" defaultValue={String(v.city ?? "")} placeholder="Kano" autoComplete="address-level2" />
          <datalist id="ganor-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
      </div>

      <div className="grid2">
        <label className="field">
          <span className="field__label">Venue</span>
          <input name="venue_name" required maxLength={120} defaultValue={String(v.venue_name ?? "")} placeholder="Kano State Banquet Hall" />
        </label>
        <label className="field">
          <span className="field__label">Address <small>(optional)</small></span>
          <input name="venue_address" maxLength={240} defaultValue={String(v.venue_address ?? "")} placeholder="Street, area" autoComplete="street-address" />
        </label>
      </div>

      <div className="grid2">
        <label className="field">
          <span className="field__label">Starts</span>
          <input type="datetime-local" name="starts_at" required defaultValue={String(v.starts_at ?? "")} />
        </label>
        <label className="field">
          <span className="field__label">Ends <small>(optional)</small></span>
          <input type="datetime-local" name="ends_at" defaultValue={String(v.ends_at ?? "")} />
        </label>
      </div>
      <p className="field__hint" style={{ marginTop: -8 }}>Times are Nigeria time (WAT).</p>

      <label className="field">
        <span className="field__label">About the event <small>(optional)</small></span>
        <textarea name="description" maxLength={5000} defaultValue={String(v.description ?? "")} placeholder="What guests can expect, who it's for, what to bring." />
      </label>

      <label className="check">
        <input type="checkbox" name="halal_friendly" defaultChecked={halal} />
        <span>
          <b>Halal-friendly</b>
          <span className="small muted">How it&rsquo;s run (halal food, no alcohol, prayer time and space) or what it&rsquo;s about (Islamic finance, halal trade). This is your description; Ganor doesn&rsquo;t certify events.</span>
        </span>
      </label>

      <div className="actions">
        <SubmitButton pendingText={mode === "create" ? "Creating…" : "Saving…"}>{mode === "create" ? "Create event" : "Save changes"}</SubmitButton>
      </div>
    </form>
  )
}
