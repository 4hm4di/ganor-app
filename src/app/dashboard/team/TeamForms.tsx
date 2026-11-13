"use client"

import { useActionState, useState } from "react"
import { createStaff, deleteStaff, resetStaffPassword, updateStaff, type TeamState } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"
import { ConfirmButton } from "@/components/ConfirmButton"
import { Icon } from "@/components/Icon"
import { MultiSelect } from "@/components/MultiSelect"
import { ShareLogin } from "@/components/ShareLogin"

type Ev = { id: string; label: string; hint?: string }
type Staff = { id: string; username: string; display_name: string; active: boolean; locked_until: string | null; last_login_at: string | null }

// Easy to read aloud, no look-alike characters.
function makePassword() {
  const words = ["kano", "zaria", "jos", "gate", "sahel", "baobab", "kola", "dune", "henna", "indigo", "palm", "river"]
  const a = new Uint32Array(3)
  crypto.getRandomValues(a)
  return `${words[a[0] % words.length]}-${words[a[1] % words.length]}-${String(1000 + (a[2] % 9000))}`
}

function EventPicker({ events, selected = [] }: { events: Ev[]; selected?: string[] }) {
  return (
    <MultiSelect name="event_ids" label="Events they can check in" options={events.map((e) => ({ id: e.id, label: e.label, hint: e.hint }))}
      defaultValue={selected} placeholder="Choose events…" empty="No events open for check-in. Publish an upcoming event first." />
  )
}

function Credentials({ c, gateUrl }: { c: NonNullable<TeamState["created"]>; gateUrl: string }) {
  return <ShareLogin name={c.name} username={c.username} password={c.password} url={gateUrl} what="Ganor gate" />
}

export function NewStaffForm({ events, gateUrl }: { events: Ev[]; gateUrl: string }) {
  const [state, action] = useActionState<TeamState, FormData>(createStaff, { status: "idle" })
  const [pw, setPw] = useState("")
  const [key, setKey] = useState(0)
  if (state.status === "ok" && state.created) {
    return (
      <div className="stack">
        <Credentials c={state.created} gateUrl={gateUrl} />
        <button type="button" className="btn btn--ghost btn--sm btn--plain" style={{ justifySelf: "start" }} onClick={() => { setKey((k) => k + 1); setPw(""); window.location.reload() }}>Add another</button>
      </div>
    )
  }
  return (
    <form key={key} action={action} className="stack" noValidate>
      {state.status === "error" && <div className="alert alert--error" role="alert"><Icon name="warning" /><span>{state.message}</span></div>}
      <label className="field"><span className="field__label">Their name</span>
        <input name="display_name" required maxLength={60} autoComplete="off" placeholder="Sani Musa…" />
      </label>
      <label className="field"><span className="field__label">Username <small>(3–30 letters, numbers, . - _)</small></span>
        <input name="username" required maxLength={30} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} pattern="[a-z0-9][a-z0-9._\-]{2,29}" placeholder="yourorg.sani…" />
      </label>
      <label className="field"><span className="field__label">Password <small>(at least 8 characters)</small></span>
        <span className="pwrow">
          <input name="password" required minLength={8} autoComplete="new-password" autoCapitalize="none" spellCheck={false} value={pw} onChange={(e) => setPw(e.target.value)} />
          <button type="button" className="btn btn--ghost btn--xs btn--plain" onClick={() => setPw(makePassword())}>Suggest</button>
        </span>
      </label>
      <EventPicker events={events} />
      <SubmitButton pendingText="Creating…">Create account</SubmitButton>
    </form>
  )
}

export function StaffCard({ staff, assigned, events, gateUrl }: { staff: Staff; assigned: string[]; events: Ev[]; gateUrl: string }) {
  const [state, action] = useActionState<TeamState, FormData>(updateStaff, { status: "idle" })
  const [pwState, pwAction] = useActionState<TeamState, FormData>(resetStaffPassword, { status: "idle" })
  const [pw, setPw] = useState("")
  const locked = staff.locked_until && new Date(staff.locked_until) > new Date()
  return (
    <article className="card stack staffcard" data-reveal>
      <header className="staffcard__head">
        <span className="av">{staff.display_name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
        <span>
          <b>{staff.display_name}</b>
          <small>@{staff.username} · {staff.last_login_at ? `last signed in ${new Date(staff.last_login_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}` : "hasn't signed in yet"}</small>
        </span>
        <span className={`pill ${staff.active ? "pill--published" : "pill--draft"}`}>{locked ? "Locked 15 min" : staff.active ? "Active" : "Off"}</span>
      </header>
      <details>
        <summary className="small">Edit name, events or access</summary>
        <form action={action} className="stack" style={{ marginTop: 12 }} noValidate>
          <input type="hidden" name="id" value={staff.id} />
          <label className="field"><span className="field__label">Name</span><input name="display_name" defaultValue={staff.display_name} maxLength={60} autoComplete="off" /></label>
          <EventPicker events={events} selected={assigned} />
          <label className="checkrow"><input type="checkbox" name="active" defaultChecked={staff.active} /> Account is on (switching it off signs them out straight away)</label>
          {state.message && <p className="small" role="status">{state.message}</p>}
          <SubmitButton size="sm" arrow={false} pendingText="Saving…">Save</SubmitButton>
        </form>
      </details>
      <details>
        <summary className="small">Set a new password</summary>
        {pwState.status === "ok" && pwState.created ? (
          <Credentials c={pwState.created} gateUrl={gateUrl} />
        ) : (
          <form action={pwAction} className="stack" style={{ marginTop: 12 }} noValidate>
            <input type="hidden" name="id" value={staff.id} />
            <input type="hidden" name="username" value={staff.username} />
            <input type="hidden" name="display_name" value={staff.display_name} />
            <span className="pwrow">
              <input name="password" required minLength={8} autoComplete="new-password" autoCapitalize="none" spellCheck={false} value={pw} onChange={(e) => setPw(e.target.value)} aria-label="New password" />
              <button type="button" className="btn btn--ghost btn--xs btn--plain" onClick={() => setPw(makePassword())}>Suggest</button>
            </span>
            {pwState.status === "error" && <p className="small" role="alert">{pwState.message}</p>}
            <SubmitButton size="sm" arrow={false} pendingText="Saving…">Set password</SubmitButton>
          </form>
        )}
      </details>
      <form action={deleteStaff} className="actions" style={{ justifyContent: "flex-end" }}>
        <input type="hidden" name="id" value={staff.id} />
        <ConfirmButton className="btn btn--danger btn--xs btn--plain" confirmText="Tap again to delete" pendingText="Deleting…">Delete account</ConfirmButton>
      </form>
    </article>
  )
}
