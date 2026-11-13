"use client"

import { useActionState, useState } from "react"
import { savePayout, type FormState } from "../actions"
import { NG_BANKS, maskAccount } from "@/lib/banks"
import { SubmitButton } from "@/components/SubmitButton"
import { Icon } from "@/components/Icon"

export type Payout = {
  account_type: string; business_name: string; bank_code: string; bank_name: string; account_number: string; account_name: string
  settlement_email: string | null; settlement_phone: string | null; status: string; status_note: string | null
} | null

const STATUS: Record<string, { label: string; cls: string; text: string }> = {
  pending: { label: "Being checked", cls: "badge--warn", text: "Ganor checks the account name against your bank before the first payout." },
  verified: { label: "Verified", cls: "badge--ok", text: "Payouts for paid tickets go to this account." },
  rejected: { label: "Needs a fix", cls: "badge--bad", text: "These details didn't match. Update them below." },
}

export function PayoutForm({ current, defaultName, defaultEmail }: { current: Payout; defaultName: string; defaultEmail: string }) {
  const [state, action] = useActionState<FormState, FormData>(savePayout, { status: "idle" })
  const [editing, setEditing] = useState(!current)
  const v = { ...(current ?? {}), ...(state.fields ?? {}) } as Record<string, string>
  const [type, setType] = useState(v.account_type || "individual")
  const st = current ? STATUS[current.status] ?? STATUS.pending : null

  return (
    <div className="stack">
      <div>
        <span className="kicker"><Icon name="wallet" size={16} />Payout account</span>
        <p className="field__hint" style={{ marginTop: 6 }}>Where Ganor sends your ticket money, through Paystack. Only you and Ganor&rsquo;s finance team can see this. Guests never do.</p>
      </div>
      {state.status === "ok" && <div className="alert alert--ok" role="status"><Icon name="check-circle" /><span>{state.message}</span></div>}

      {current && !editing && (
        <div className="payout">
          <div className="payout__row"><span className="payout__bank">{current.bank_name}</span>{st && <span className={`badge ${st.cls}`}>{st.label}</span>}</div>
          <b className="payout__num">{maskAccount(current.account_number)}</b>
          <span className="small muted">{current.account_name} · {current.account_type === "business" ? "Business" : "Individual"} · paid as &ldquo;{current.business_name}&rdquo;</span>
          {st && <span className="small muted">{current.status === "rejected" && current.status_note ? current.status_note : st.text}</span>}
          <div><button type="button" className="btn btn--ghost btn--xs btn--plain" onClick={() => setEditing(true)}>Change payout details</button></div>
        </div>
      )}

      {editing && (
        <form action={action} className="stack" key={state.fields ? JSON.stringify(state.fields) : "init"} noValidate>
          {state.status === "error" && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>}
          <div className="choice" role="radiogroup" aria-label="Account type">
            {[["individual", "Individual"], ["business", "Registered business"]].map(([k, l]) => (
              <label key={k} className={`choice__o${type === k ? " is-on" : ""}`}>
                <input type="radio" name="account_type" value={k} checked={type === k} onChange={() => setType(k)} />{l}
              </label>
            ))}
          </div>
          <label className="field">
            <span className="field__label">{type === "business" ? "Registered business name" : "Name for payouts"}</span>
            <input name="business_name" required maxLength={100} defaultValue={v.business_name ?? defaultName} autoComplete="organization" />
            <span className="field__hint">{type === "business" ? "As registered with CAC. Paystack shows this on settlements." : "Usually your full name or your brand name."}</span>
          </label>
          <label className="field">
            <span className="field__label">Bank</span>
            <select name="bank_code" required defaultValue={v.bank_code ?? ""}>
              <option value="" disabled>Choose your bank…</option>
              {NG_BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Account number</span>
            <input name="account_number" required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} autoComplete="off" defaultValue={v.account_number ?? ""} placeholder="10 digits" spellCheck={false} />
            <span className="field__hint">Your 10-digit NUBAN.</span>
          </label>
          <label className="field">
            <span className="field__label">Account name</span>
            <input name="account_name" required maxLength={100} autoComplete="off" defaultValue={v.account_name ?? ""} placeholder="Exactly as your bank shows it" />
          </label>
          <div className="grid2">
            <label className="field">
              <span className="field__label">Payout email <small>(optional)</small></span>
              <input name="settlement_email" type="email" inputMode="email" autoCapitalize="none" spellCheck={false} defaultValue={v.settlement_email ?? defaultEmail} />
            </label>
            <label className="field">
              <span className="field__label">Payout phone <small>(optional)</small></span>
              <input name="settlement_phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={v.settlement_phone ?? ""} placeholder="0803 123 4567" />
            </label>
          </div>
          <label className="check">
            <input type="checkbox" name="confirm" value="1" required />
            <span>This account belongs to me or my business, and I&rsquo;m allowed to receive payouts into it.</span>
          </label>
          <div className="actions" style={{ gap: 8 }}>
            <SubmitButton pendingText="Saving…">Save payout details</SubmitButton>
            {current && <button type="button" className="btn btn--ghost btn--plain" onClick={() => setEditing(false)}>Cancel</button>}
          </div>
        </form>
      )}
    </div>
  )
}
