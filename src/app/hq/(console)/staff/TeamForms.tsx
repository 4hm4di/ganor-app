"use client"

import { useActionState, useState } from "react"
import { createMember, resetMemberPassword, setStaffRole, updateMember, type AdminState } from "../actions"
import { SubmitButton } from "@/components/SubmitButton"
import { PasswordField } from "@/components/PasswordField"
import { HQ_ROLES } from "@/lib/hq-roles"

function Msg({ s }: { s: AdminState }) {
  if (!s.message) return null
  return <p className={`small ${s.status === "error" ? "txt-bad" : "txt-ok"}`} role={s.status === "error" ? "alert" : "status"}>{s.message}</p>
}

// A readable, strong password: three words-ish chunks plus digits. Shown once so the owner can pass it on.
function makePassword() {
  const a = "abcdefghjkmnpqrstuvwxyz", A = "ABCDEFGHJKMNPQRSTUVWXYZ", n = "23456789", sy = "!@#%*+?"
  const pick = (s: string, k: number) => Array.from(crypto.getRandomValues(new Uint32Array(k)), (x) => s[x % s.length]).join("")
  return `${pick(A, 1)}${pick(a, 4)}-${pick(n, 3)}${pick(sy, 1)}${pick(a, 3)}${pick(A, 1)}${pick(n, 2)}`
}

export function RoleSelect({ name = "role", defaultValue = "viewer", disabled }: { name?: string; defaultValue?: string; disabled?: boolean }) {
  return (
    <select name={name} defaultValue={defaultValue} disabled={disabled} aria-label="Role">
      {HQ_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
    </select>
  )
}

export function CreateMemberForm() {
  const [state, action] = useActionState<AdminState, FormData>(createMember, { status: "idle" })
  const [pw, setPw] = useState("")
  const [confirm, setConfirm] = useState("")
  const [made, setMade] = useState("")
  const [role, setRole] = useState("support")
  const generate = () => { const p = makePassword(); setPw(p); setConfirm(p); setMade(p) }
  const roleInfo = HQ_ROLES.find((r) => r.value === role)
  return (
    <form action={action} className="stack" autoComplete="off" noValidate key={state.status === "ok" ? state.message : "f"}>
      <div className="grid2">
        <label className="field"><span className="field__label">Full name</span>
          <input name="display_name" required maxLength={60} autoComplete="off" placeholder="Aisha Bello" />
        </label>
        <label className="field"><span className="field__label">Username</span>
          <input name="username" required minLength={3} maxLength={32} pattern="[a-z0-9][a-z0-9._-]{2,31}" autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="aisha.ops" />
          <span className="field__hint">Lowercase letters, numbers, dots or dashes. Used to sign in.</span>
        </label>
      </div>
      <label className="field"><span className="field__label">Role</span>
        <select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
          {HQ_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        {roleInfo && <span className="field__hint">{roleInfo.does}</span>}
      </label>
      <PasswordField label="Password" autoComplete="new-password" minLength={10} meter value={pw} onChange={(v) => { setPw(v); setMade("") }}
        labelExtra={<button type="button" className="linkbtn" onClick={generate}>Generate one</button>} />
      <PasswordField name="confirm" label="Type it again" autoComplete="new-password" minLength={10} value={confirm} onChange={setConfirm} />
      {made && <p className="genpw">Generated: <code>{made}</code> <button type="button" className="linkbtn" onClick={() => navigator.clipboard?.writeText(made)}>Copy</button></p>}
      <p className="field__hint">At least 10 characters with letters and numbers. You&rsquo;ll pass it on yourself; Ganor never emails HQ passwords.</p>
      <SubmitButton pendingText="Creating…">Create HQ login</SubmitButton>
      <Msg s={state} />
    </form>
  )
}

export function MemberRow({ m }: { m: { user_id: string; role: string; active: boolean; is_self: boolean; login_kind: string } }) {
  const [state, action] = useActionState<AdminState, FormData>(updateMember, { status: "idle" })
  const [pwState, pwAction] = useActionState<AdminState, FormData>(resetMemberPassword, { status: "idle" })
  const [reset, setReset] = useState(false)
  const [pw, setPw] = useState("")
  const [made, setMade] = useState("")
  return (
    <div className="stack" style={{ gap: 8 }}>
      <form action={action} className="memctl">
        <input type="hidden" name="user_id" value={m.user_id} />
        <RoleSelect defaultValue={m.role} disabled={m.is_self} />
        <select name="active" defaultValue={m.active ? "1" : "0"} disabled={m.is_self} aria-label="Access">
          <option value="1">Can sign in</option>
          <option value="0">Switched off</option>
        </select>
        {!m.is_self && <SubmitButton size="xs" variant="ghost" arrow={false} pendingText="Saving…">Save</SubmitButton>}
        {m.login_kind === "username" && !m.is_self && <button type="button" className="btn btn--ghost btn--xs btn--plain" onClick={() => setReset((r) => !r)}>Reset password</button>}
      </form>
      <Msg s={state} />
      {reset && (
        <form action={pwAction} className="stack" style={{ gap: 8 }} autoComplete="off">
          <input type="hidden" name="user_id" value={m.user_id} />
          <PasswordField label="New password" autoComplete="new-password" minLength={10} meter value={pw} onChange={(v) => { setPw(v); setMade("") }}
            labelExtra={<button type="button" className="linkbtn" onClick={() => { const p = makePassword(); setPw(p); setMade(p) }}>Generate one</button>} />
          {made && <p className="genpw">Generated: <code>{made}</code> <button type="button" className="linkbtn" onClick={() => navigator.clipboard?.writeText(made)}>Copy</button></p>}
          <div><SubmitButton size="xs" arrow={false} pendingText="Saving…">Set password</SubmitButton></div>
          <Msg s={pwState} />
        </form>
      )}
    </div>
  )
}

export function AddEmailMemberForm() {
  const [state, action] = useActionState<AdminState, FormData>(setStaffRole, { status: "idle" })
  return (
    <form action={action} className="stack" noValidate>
      <div className="grid2">
        <label className="field"><span className="field__label">Email of their Ganor account</span>
          <input name="email" type="email" required autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="name@ganor.ng" />
        </label>
        <label className="field"><span className="field__label">Role</span><RoleSelect /></label>
      </div>
      <div className="actions" style={{ gap: 8 }}>
        <button className="btn btn--primary btn--sm btn--plain" name="grant" value="1">Give HQ access</button>
        <button className="btn btn--ghost btn--sm btn--plain" name="grant" value="0">Remove access</button>
      </div>
      <Msg s={state} />
    </form>
  )
}
