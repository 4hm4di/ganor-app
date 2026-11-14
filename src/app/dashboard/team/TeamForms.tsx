"use client"

import { useActionState, useState } from "react"
import { createStaff, deleteStaff, resetStaffPassword, updateStaff, type TeamState } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"
import { ConfirmButton } from "@/components/ConfirmButton"
import { Icon } from "@/components/Icon"
import { CheckPick } from "@/components/CheckPick"
import { ShareLogin } from "@/components/ShareLogin"

export type TeamEvent = { id: string; label: string; when: string; venue: string; draft: boolean; free: boolean; heldBy: string | null }
type Staff = { id: string; username: string; display_name: string; active: boolean; locked_until: string | null; last_login_at: string | null }

// Easy to read aloud, no look-alike characters.
function makePassword() {
  const words = ["kano", "zaria", "jos", "gate", "sahel", "baobab", "kola", "dune", "henna", "indigo", "palm", "river"]
  const a = new Uint32Array(3)
  crypto.getRandomValues(a)
  return `${words[a[0] % words.length]}-${words[a[1] % words.length]}-${String(1000 + (a[2] % 9000))}`
}

const toast = (m: string, k: "ok" | "error" = "ok") => window.dispatchEvent(new CustomEvent("ganor:toast", { detail: { k, m } }))
async function copyText(text: string, done: string) {
  try { await navigator.clipboard.writeText(text); toast(done) } catch { toast("Couldn't copy. Press and hold the text to copy it.", "error") }
}

function EventPicker({ events, selected = [], staffId }: { events: TeamEvent[]; selected?: string[]; staffId?: string }) {
  // A free RSVP event that already has its one gate account can't be picked for anyone else.
  const taken = (e: TeamEvent) => !!e.heldBy && e.heldBy !== staffId
  return (
    <CheckPick
      name="event_ids"
      label="Events they can check in"
      help="They only see the events you tick here. You can change this any time."
      empty="No events open for check-in yet. Create or publish an upcoming event first, then come back and tick it."
      defaultValue={selected}
      options={events.map((e) => ({
        id: e.id,
        label: e.label,
        meta: `${e.when} · ${e.venue}`,
        tags: [...(e.draft ? ["Draft: shows once published"] : []), ...(e.free && !taken(e) ? ["Free plan: 1 gate account"] : [])],
        disabled: taken(e),
        why: "Free plan: its 1 gate account is taken. Upgrade the plan to add more.",
      }))}
    />
  )
}

function Credentials({ c, gateUrl }: { c: NonNullable<TeamState["created"]>; gateUrl: string }) {
  return <ShareLogin name={c.name} username={c.username} password={c.password} url={gateUrl} what="Ganor gate" />
}

export function NewStaffForm({ events, gateUrl }: { events: TeamEvent[]; gateUrl: string }) {
  const [state, action] = useActionState<TeamState, FormData>(createStaff, { status: "idle" })
  const [pw, setPw] = useState("")
  if (state.status === "ok" && state.created) {
    return (
      <div className="stack">
        <Credentials c={state.created} gateUrl={gateUrl} />
        <button type="button" className="btn btn--ghost btn--sm btn--plain" style={{ justifySelf: "start" }} onClick={() => window.location.reload()}>Add another</button>
      </div>
    )
  }
  return (
    <form action={action} className="stack" noValidate>
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

export function StaffCard({ staff, assigned, events, gateUrl }: { staff: Staff; assigned: string[]; events: TeamEvent[]; gateUrl: string }) {
  const [state, action] = useActionState<TeamState, FormData>(updateStaff, { status: "idle" })
  const [pwState, pwAction] = useActionState<TeamState, FormData>(resetStaffPassword, { status: "idle" })
  const [pw, setPw] = useState("")
  const [panel, setPanel] = useState<null | "edit" | "password">(null)
  const locked = !!staff.locked_until && new Date(staff.locked_until) > new Date()
  const mine = events.filter((e) => assigned.includes(e.id))
  const first = staff.display_name.split(/\s+/)[0]
  const status = locked ? { text: "Locked 15 min", cls: "pill--soldout" } : staff.active ? { text: "Active", cls: "pill--published" } : { text: "Switched off", cls: "pill--draft" }
  // Passwords are stored scrambled, so they can't be shown or copied again. The details carry the rest.
  const details = `Ganor gate sign-in for ${staff.display_name}\nLink: ${gateUrl}\nUsername: ${staff.username}\nPassword: the one I gave you (ask me if you've lost it)`
  const tab = (key: "edit" | "password", label: string, icon: string) => (
    <button type="button" className={`staffcard__tab${panel === key ? " is-on" : ""}`} aria-expanded={panel === key} aria-controls={`${staff.id}-${key}`} onClick={() => setPanel(panel === key ? null : key)}>
      <Icon name={icon} size={16} />{label}
    </button>
  )

  return (
    <article className="card staffcard" data-reveal>
      <header className="staffcard__head">
        <span className="av">{staff.display_name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
        <span>
          <b>{staff.display_name}</b>
          <small>{staff.last_login_at ? `Last signed in ${new Date(staff.last_login_at).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}` : "Hasn't signed in yet"}</small>
        </span>
        <span className={`pill ${status.cls}`}>{status.text}</span>
      </header>

      <dl className="staffcard__facts">
        <div>
          <dt>Username</dt>
          <dd>
            <code>{staff.username}</code>
            <button type="button" className="staffcard__copy" onClick={() => copyText(staff.username, "Username copied.")} aria-label={`Copy username ${staff.username}`}>Copy</button>
          </dd>
        </div>
        <div>
          <dt>Checks in</dt>
          <dd>
            {mine.length === 0
              ? <span className="staffcard__none"><Icon name="warning" size={16} />No events yet, so {first} can&rsquo;t scan anything. Use Edit to tick one.</span>
              : <span className="staffcard__events">{mine.map((e) => <span key={e.id} className="badge">{e.label}</span>)}</span>}
          </dd>
        </div>
      </dl>

      <div className="staffcard__share">
        <button type="button" className="btn btn--primary btn--xs btn--plain" onClick={() => copyText(details, "Sign-in details copied.")}><Icon name="doc" size={16} />Copy sign-in details</button>
        <a className="btn btn--ghost btn--xs btn--plain" href={`https://wa.me/?text=${encodeURIComponent(details)}`} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={16} />Send on WhatsApp</a>
      </div>
      <p className="staffcard__note">Copies the link and username. The password is never shown again after you create it; if {first} lost it, set a new one below.</p>

      <div className="staffcard__tabs">
        {tab("edit", "Edit", "pen")}
        {tab("password", "New password", "lock")}
        <form action={deleteStaff} className="staffcard__del">
          <input type="hidden" name="id" value={staff.id} />
          <ConfirmButton className="staffcard__tab staffcard__tab--danger" confirmText="Tap again to delete" pendingText="Deleting…">Delete</ConfirmButton>
        </form>
      </div>

      {panel === "edit" && (
        <form id={`${staff.id}-edit`} action={action} className="stack staffcard__panel" noValidate>
          <input type="hidden" name="id" value={staff.id} />
          <label className="field"><span className="field__label">Name</span><input name="display_name" defaultValue={staff.display_name} maxLength={60} autoComplete="off" /></label>
          <EventPicker events={events} selected={assigned} staffId={staff.id} />
          <label className="checkrow"><input type="checkbox" name="active" defaultChecked={staff.active} /><span><b>Account is on</b><br /><small className="muted">Switching it off signs {first} out straight away.</small></span></label>
          {state.status === "error" && <p className="small txt-bad" role="alert">{state.message}</p>}
          <div className="actions" style={{ gap: 8 }}>
            <SubmitButton size="sm" arrow={false} pendingText="Saving…">Save changes</SubmitButton>
            <button type="button" className="btn btn--ghost btn--sm btn--plain" onClick={() => setPanel(null)}>Close</button>
          </div>
        </form>
      )}

      {panel === "password" && (
        <div id={`${staff.id}-password`} className="staffcard__panel">
          {pwState.status === "ok" && pwState.created ? (
            <Credentials c={pwState.created} gateUrl={gateUrl} />
          ) : (
            <form action={pwAction} className="stack" noValidate>
              <input type="hidden" name="id" value={staff.id} />
              <input type="hidden" name="username" value={staff.username} />
              <input type="hidden" name="display_name" value={staff.display_name} />
              <label className="field"><span className="field__label">New password <small>(at least 8 characters)</small></span>
                <span className="pwrow">
                  <input name="password" required minLength={8} autoComplete="new-password" autoCapitalize="none" spellCheck={false} value={pw} onChange={(e) => setPw(e.target.value)} />
                  <button type="button" className="btn btn--ghost btn--xs btn--plain" onClick={() => setPw(makePassword())}>Suggest</button>
                </span>
              </label>
              <p className="small muted">Setting a new password signs {first} out on their phone. You&rsquo;ll get the full details to copy straight after.</p>
              {pwState.status === "error" && <p className="small txt-bad" role="alert">{pwState.message}</p>}
              <div className="actions" style={{ gap: 8 }}>
                <SubmitButton size="sm" arrow={false} pendingText="Saving…">Set password</SubmitButton>
                <button type="button" className="btn btn--ghost btn--sm btn--plain" onClick={() => setPanel(null)}>Close</button>
              </div>
            </form>
          )}
        </div>
      )}
    </article>
  )
}
