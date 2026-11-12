import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { siteOrigin } from "@/lib/auth"
import { Icon } from "@/components/Icon"
import { formatDate } from "@/lib/ganor"
import { NewStaffForm, StaffCard } from "./TeamForms"

export const metadata: Metadata = { title: "Gate team" }

export default async function Team() {
  const { supabase, userId } = await getUserId()
  if (!userId) redirect("/login?next=/dashboard/team")
  const [{ data: staff }, { data: links }, { data: events }] = await Promise.all([
    supabase.from("host_staff").select("id, username, display_name, active, locked_until, last_login_at, created_at").eq("host_id", userId).order("created_at"),
    supabase.from("host_staff_events").select("staff_id, event_id"),
    supabase.from("events").select("id, title, starts_at, status").eq("host_id", userId).neq("status", "cancelled").order("starts_at"),
  ])
  const gateUrl = `${await siteOrigin()}/gate`
  const evs = (events ?? []).map((e) => ({ id: e.id, label: `${e.title} · ${formatDate(e.starts_at, { day: "numeric", month: "short" })}${e.status === "draft" ? " (draft)" : ""}` }))

  return (
    <div className="wrap">
      <div className="pagehead">
        <div>
          <span className="kicker"><Icon name="users" size={18} />Gate team</span>
          <h1 style={{ marginTop: 10 }}>People who check guests in</h1>
          <p className="muted">Give each person their own username and password. They can only scan tickets for the events you assign, nothing else. They sign in at <b>{gateUrl.replace(/^https?:\/\//, "")}</b>.</p>
        </div>
      </div>
      <div className="team">
        <section className="card stack" aria-labelledby="new-h" data-reveal>
          <h2 id="new-h" className="card__title" style={{ font: "700 18px/24px var(--ganor-font-body)" }}><Icon name="add-circle" />Add a gate account</h2>
          <NewStaffForm events={evs} gateUrl={gateUrl} />
        </section>
        <section className="stack" aria-labelledby="list-h">
          <h2 id="list-h" className="section-t">Accounts ({staff?.length ?? 0})</h2>
          {(staff ?? []).length === 0 && <div className="card"><p className="muted">No gate accounts yet. You can always scan tickets yourself from an event&rsquo;s Gate check-in card.</p></div>}
          {(staff ?? []).map((s) => (
            <StaffCard
              key={s.id}
              staff={s}
              assigned={(links ?? []).filter((l) => l.staff_id === s.id).map((l) => l.event_id)}
              events={evs}
              gateUrl={gateUrl}
            />
          ))}
        </section>
      </div>
    </div>
  )
}
