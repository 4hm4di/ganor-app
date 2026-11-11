"use client"

import { useActionState, useOptimistic, useState, useTransition } from "react"
import { deleteTicketType, setTicketOnSale, updateTicketType, type FormState } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"
import { formatNaira } from "@/lib/ganor"
import type { TicketTypeRow } from "@/lib/database.types"

// One row of the Ticket types card: same layout and switch as the landing page, plus an edit pencil.
export function TicketRow({ t }: { t: TicketTypeRow }) {
  const [editing, setEditing] = useState(false)
  const [onSale, setOnSale] = useOptimistic(t.on_sale)
  const [, startTransition] = useTransition()
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await updateTicketType(prev, fd)
    if (result.status === "ok") setEditing(false)
    return result
  }, { status: "idle" })

  function toggle() {
    startTransition(async () => {
      setOnSale(!onSale)
      await setTicketOnSale(t.id, t.event_id, !onSale)
    })
  }

  if (!editing) {
    return (
      <li>
        <span>
          <b>{t.name}</b>
          <small>{formatNaira(t.price_kobo)} · {t.sold} of {t.quantity} sold</small>
        </span>
        <span className="types__end">
          <button type="button" className="iconbtn" onClick={() => setEditing(true)} aria-label={`Edit ${t.name}`}><Icon name="pen" size={18} /></button>
          <button
            type="button"
            className="switch"
            role="switch"
            aria-checked={onSale}
            aria-label={`${t.name} tickets on sale`}
            onClick={toggle}
          ><i /></button>
        </span>
      </li>
    )
  }

  return (
    <li className="types__edit">
      <form action={action} className="stack" noValidate>
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="event_id" value={t.event_id} />
        {state.status === "error" && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>}
        <label className="field"><span className="field__label">Ticket name</span>
          <input name="name" required maxLength={60} defaultValue={state.fields?.name ?? t.name} />
        </label>
        <div className="grid2">
          <label className="field"><span className="field__label">Price (₦){t.sold > 0 && <small> locked</small>}</span>
            <input name="price" inputMode="decimal" defaultValue={state.fields?.price ?? String(t.price_kobo / 100)} readOnly={t.sold > 0} aria-readonly={t.sold > 0} />
          </label>
          <label className="field"><span className="field__label">How many</span>
            <input name="quantity" required inputMode="numeric" defaultValue={state.fields?.quantity ?? String(t.quantity)} />
          </label>
        </div>
        <label className="field"><span className="field__label">Most per order</span>
          <input name="max_per_order" inputMode="numeric" defaultValue={state.fields?.max_per_order ?? String(t.max_per_order)} />
        </label>
        <label className="field"><span className="field__label">What&rsquo;s included <small>(optional)</small></span>
          <input name="description" maxLength={280} defaultValue={state.fields?.description ?? t.description} />
        </label>
        <div className="actions" style={{ justifyContent: "space-between" }}>
          <div className="actions" style={{ gap: 8 }}>
            <SubmitButton size="xs" arrow={false} pendingText="Saving">Save</SubmitButton>
            <button type="button" className="btn btn--ghost btn--xs btn--plain" onClick={() => setEditing(false)}>Cancel</button>
          </div>
          {t.sold === 0 && (
            <button type="submit" formAction={deleteTicketType} className="btn btn--danger btn--xs btn--plain">Delete</button>
          )}
        </div>
      </form>
    </li>
  )
}
