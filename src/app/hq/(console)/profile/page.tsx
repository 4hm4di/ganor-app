import type { Metadata } from "next"
import { getHq, roleLabel, roleIcon, HQ_ROLES } from "@/lib/hq"
import { getUserId } from "@/lib/supabase/server"
import { Icon } from "@/components/Icon"
import { GanorSymbol } from "@/components/Loader"
import { NameForm, PasswordForm } from "./ProfileForms"

export const metadata: Metadata = { title: { absolute: "Ganor" }, robots: { index: false } }

export default async function HqProfile() {
  const [{ me }, { email }] = await Promise.all([getHq(), getUserId()])
  if (!me) return null
  const role = HQ_ROLES.find((r) => r.value === me.role)
  const login = me.username ?? email ?? ""
  return (
    <div className="stack">
      <h1 className="hq__h1"><Icon name="user" size={26} />Your profile</h1>
      <div className="dash">
        <section className="card awidget s-4" data-reveal>
          <div className="hqme">
            <span className="hqme__av" aria-hidden="true"><GanorSymbol size={44} /></span>
            <b>{me.display_name ?? "Ganor HQ"}</b>
            <span className={`rolebadge rolebadge--${me.role}`}><Icon name={roleIcon(me.role)} size={14} />{roleLabel(me.role)}</span>
            <small>Signs in as <code>{login}</code></small>
            {role && <p className="small muted">{role.does}</p>}
          </div>
        </section>
        <section className="card awidget s-4" data-reveal>
          <header className="awidget__head"><span className="awidget__ic"><Icon name="pen" size={18} /></span><div><h2>Name</h2><p>How you appear across HQ</p></div></header>
          <NameForm name={me.display_name ?? ""} />
        </section>
        <section className="card awidget s-4" data-reveal>
          <header className="awidget__head"><span className="awidget__ic"><Icon name="lock" size={18} /></span><div><h2>Password</h2><p>At least 10 characters, letters and numbers</p></div></header>
          <PasswordForm />
        </section>
      </div>
    </div>
  )
}
