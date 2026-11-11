"use client"

import { useActionState, useState } from "react"
import { addTicketType, type FormState } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"
import { feeKobo, formatNaira } from "@/lib/ganor"

export function TicketForm({ eventId, first }: { eventId: string; first: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(addTicketType, { status: "idle" })
  const [price, setPrice] = useState(state.fields?.price ?? "")
  const kobo = Math.round((Number(price.replace(/[,\s₦]/g, "")) || 0) * 100)
  const key = state.status === "ok" ? `ok-${state.message}` : state.fields ? JSON.stringify(state.fields) : "init"

  return (
    <form action={action} className="stack" key={key} noValidate>
      <input type="hidden" name="event_id" value={eventId} />
      {state.status === "error" && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>}
      {state.status === "ok" && <div className="alert alert--ok" role="status"><Icon name="check-circle" /><span>{state.message}</span></div>}
      <div className="grid2">
        <label className="field">
          <span className="field__label">Ticket name</span>
          <input name="name" required maxLength={60} defaultValue={state.fields?.name ?? (first ? "Regular" : "")} placeholder="Regular, VIP, Student" />
        </label>
        <label className="field">
          <span className="field__label">Price in naira <small>(0 for free)</small></span>
          <input name="price" inputMode="decimal" defaultValue={state.fields?.price ?? ""} onChange={(e) => setPrice(e.target.value)} placeholder="5,000" />
        </label>
      </div>
      <div className="grid2">
        <label className="field">
          <span className="field__label">How many</span>
          <input name="quantity" required inputMode="numeric" defaultValue={state.fields?.quantity ?? ""} placeholder="200" />
        </label>
        <label className="field">
          <span className="field__label">Most per order</span>
          <input name="max_per_order" inputMode="numeric" defaultValue={state.fields?.max_per_order ?? "10"} />
        </label>
      </div>
      <label className="field">
        <span className="field__label">What&rsquo;s included <small>(optional)</small></span>
        <input name="description" maxLength={280} defaultValue={state.fields?.description ?? ""} placeholder="Front rows, lunch, certificate" />
      </label>
      <p className="field__hint">
        {kobo > 0
          ? <>Ganor fee: {formatNaira(feeKobo(kobo))} per ticket (5% + ₦100). Who pays it is set when ticket sales open.</>
          : <>Free tickets cost nothing.</>}
      </p>
      <div className="actions">
        <SubmitButton variant="outline" size="sm" pendingText="Adding…">Add ticket type</SubmitButton>
      </div>
    </form>
  )
}
