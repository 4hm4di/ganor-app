import type { Metadata } from "next"
import { getHq, HQ_ROLES, roleLabel } from "@/lib/hq"
import { formatDate, formatTime } from "@/lib/ganor"
import { ConfirmButton } from "@/components/ConfirmButton"
import { removeMember } from "../actions"
import { AddEmailMemberForm, CreateMemberForm, MemberRow } from "./TeamForms"

export const metadata: Metadata = { title: { absolute: "Ganor" }, robots: { index: false } }

export default async function HqTeam() {
  const { me, supabase } = await getHq()
  const [{ data: members }, { data: log }] = await Promise.all([
    supabase.rpc("hq_members"),
    me?.can.audit ? supabase.rpc("admin_recent_actions", { p_limit: 100 }) : Promise.resolve({ data: null }),
  ])
  const owner = me?.role === "owner"
  return (
    <div className="stack">
      <h1>{owner ? "Team & roles" : "Team"}</h1>

      <section className="card stack" data-reveal>
        <h2 className="admin__h2">Roles</h2>
        <div className="roles">
          {HQ_ROLES.map((r) => (
            <div key={r.value} className={`roles__r${me?.role === r.value ? " is-me" : ""}`}>
              <b>{r.label}{me?.role === r.value && <span className="badge badge--ok">You</span>}</b>
              <small>{r.does}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="admin__cols">
        <section className="card stack" data-reveal>
          <h2 className="admin__h2">HQ members ({(members ?? []).length})</h2>
          <ul className="memlist">
            {(members ?? []).map((m) => (
              <li key={m.user_id} className={m.active ? "" : "is-off"}>
                <div className="memlist__who">
                  <b>{m.display_name || m.username || "Unnamed"} <span className="badge">{roleLabel(m.role)}</span>{!m.active && <span className="badge badge--bad">Switched off</span>}</b>
                  <small>
                    {m.username ? <>Username <code>{m.username}</code></> : m.email ?? "Email login"}
                    {" · "}{m.last_sign_in_at ? `last in ${formatDate(m.last_sign_in_at, { day: "numeric", month: "short" })} ${formatTime(m.last_sign_in_at)}` : "never signed in"}
                  </small>
                </div>
                {owner && <MemberRow m={m} />}
                {owner && !m.is_self && (
                  <form action={removeMember}>
                    <input type="hidden" name="user_id" value={m.user_id} />
                    <ConfirmButton className="btn btn--ghost btn--xs btn--plain txt-bad" confirmText={m.login_kind === "username" ? "Tap again to delete this login" : "Tap again to remove access"} pendingText="Removing…">Remove</ConfirmButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>

        {owner ? (
          <section className="card stack" data-reveal>
            <h2 className="admin__h2">Create an HQ login</h2>
            <p className="small muted">For staff who don&rsquo;t need a host account. They sign in at this HQ address with the username and password you set here.</p>
            <CreateMemberForm />
            <hr className="hr" />
            <h2 className="admin__h2">Or give an existing account access</h2>
            <AddEmailMemberForm />
          </section>
        ) : (
          <section className="card stack" data-reveal>
            <h2 className="admin__h2">Need more access?</h2>
            <p className="small muted">Only an HQ owner can change roles. Ask them if your work needs something your role can&rsquo;t do.</p>
          </section>
        )}
      </div>

      {me?.can.audit && (
        <section className="card stack" data-reveal>
          <h2 className="admin__h2">HQ log</h2>
          {(log ?? []).length === 0 ? <p className="muted">No actions yet.</p> : (
            <ul className="sendlist">
              {(log ?? []).map((l, i) => (
                <li key={i}><span><b>{l.action.replace(/_/g, " ")}</b><small>{l.actor_name} · {formatDate(l.created_at, { day: "numeric", month: "short" })} {formatTime(l.created_at)} · {l.target_type}{l.note ? ` · ${l.note}` : ""}</small></span></li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
