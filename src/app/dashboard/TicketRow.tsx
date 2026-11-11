"use client"

import { useActionState, useState } from "react"
import { deleteTicketType, updateTicketType, type FormState } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"
import { feeKobo, formatNaira } from "@/lib/ganor"
import type { TicketTypeRow } from "@/lib/database.types"

export function TicketRow({ t, feeMode }: { t: TicketTypeRow; feeMode: string }) {
  const [editing, setEditing] = useState(false)
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await updateTicketType(prev, fd)
    if (result.status === "ok") setEditing(false)
    return result
  }, { status: "idle" })
  const fee = feeKobo(t.price_kobo)
  const left = t.quantity - t.sold

  if (!editing) {
    return (
      <li className="trow">
        <div className="trow__main">
          <b>{t.name}</b>
          <small>
            {t.sold} sold · {left} left · up to {t.max_per_order} per order
            {t.description ? ` · ${t.description}` : ""}
          </small>
          {fee > 0 && (
            <small>{feeMode === "buyer" ? `Buyer pays ${formatNaira(t.price_kobo + fee)}` : `You get ${formatNaira(t.price_kobo - fee)} per ticket`}</small>
          )}
        </div>
        <div className="trow__end">
          <span className="tt__price">{formatNaira(t.price_kobo)}</span>
          <button type="button" className="iconbtn" onClick={() => setEditing(true)} aria-label={`Edit ${t.name}`}><Icon name="pen" size={18} /></button>
        </div>
      </li>
    )
  }

  return (
    <li className="trow trow--edit">
      <form action={action} className="stack" noValidate>
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="event_id" value={t.event_id} />
        {state.status === "error" && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>}
        <div className="grid2">
          <label className="field"><span className="field__label">Ticket name</span>
            <input name="name" required maxLength={60} defaultValue={state.fields?.name ?? t.name} />
          </label>
          <label className="field"><span className="field__label">Price in naira {t.sold > 0 && <small>(locked after sales)</small>}</span>
            <input name="price" inputMode="decimal" defaultValue={state.fields?.price ?? String(t.price_kobo / 100)} readOnly={t.sold > 0} aria-readonly={t.sold > 0} />
          </label>
        </div>
        <div className="grid2">
          <label className="field"><span className="field__label">How many <small>{t.sold > 0 ? `(at least ${t.sold})` : ""}</small></span>
            <input name="quantity" required inputMode="numeric" defaultValue={state.fields?.quantity ?? String(t.quantity)} />
          </label>
          <label className="field"><span className="field__label">Most per order</span>
            <input name="max_per_order" inputMode="numeric" defaultValue={state.fields?.max_per_order ?? String(t.max_per_order)} />
          </label>
        </div>
        <label className="field"><span className="field__label">What&rsquo;s included <small>(optional)</small></span>
          <input name="description" maxLength={280} defaultValue={state.fields?.description ?? t.description} />
        </label>
        <div className="actions" style={{ justifyContent: "space-between" }}>
          <div className="actions" style={{ gap: 8 }}>
            <SubmitButton size="sm" pendingText="Saving…">Save ticket</SubmitButton>
            <button type="button" className="btn btn--ghost btn--sm btn--plain" onClick={() => setEditing(false)}>Cancel</button>
          </div>
          {t.sold === 0 && (
            <button type="submit" formAction={deleteTicketType} className="btn btn--danger btn--sm btn--plain">Delete</button>
          )}
        </div>
      </form>
    </li>
  )
}
