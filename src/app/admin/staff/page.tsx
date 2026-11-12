import type { Metadata } from "next"
import { getUserId } from "@/lib/supabase/server"
import { formatDate, formatTime } from "@/lib/ganor"
import { StaffRoleForm } from "../AdminForms"

export const metadata: Metadata = { title: "Staff · Admin", robots: { index: false } }

export default async function AdminStaff() {
  const { supabase } = await getUserId()
  const [{ data: hosts }, { data: log }] = await Promise.all([
    supabase.rpc("admin_hosts"),
    supabase.rpc("admin_recent_actions", { p_limit: 100 }),
  ])
  const staff = (hosts ?? []).filter((h) => h.is_staff)
  return (
    <div className="stack">
      <h1>Staff &amp; log</h1>
      <div className="admin__cols">
        <section className="card stack" data-reveal>
          <h2 className="admin__h2">Ganor staff ({staff.length})</h2>
          <p className="small muted">Staff can see every host, event and order, suspend hosts, change event status and moderate reviews. Give this only to people who run Ganor.</p>
          <ul className="sendlist">
            {staff.map((s) => <li key={s.id}><span><b>{s.display_name || "Unnamed"}</b><small>{s.email}</small></span></li>)}
          </ul>
          <StaffRoleForm />
        </section>
        <section className="card stack" data-reveal>
          <h2 className="admin__h2">Admin log</h2>
          {(log ?? []).length === 0 ? <p className="muted">No actions yet.</p> : (
            <ul className="sendlist">
              {(log ?? []).map((l, i) => (
                <li key={i}><span><b>{l.action.replace(/_/g, " ")}</b><small>{l.actor_name} · {formatDate(l.created_at, { day: "numeric", month: "short" })} {formatTime(l.created_at)} · {l.target_type}{l.note ? ` · ${l.note}` : ""}</small></span></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
