import type { Metadata } from "next"
import Link from "next/link"
import { createClient, getUserId } from "@/lib/supabase/server"
import { gateToken, type GateSession } from "@/lib/gate"
import { Icon } from "@/components/Icon"
import { formatDate, formatTime } from "@/lib/ganor"
import { GateLoginForm } from "./GateLoginForm"
import { gateLogout } from "./actions"

export const metadata: Metadata = { title: "Gate check-in", robots: { index: false } }

export default async function Gate() {
  const token = await gateToken()
  const supabase = await createClient()
  const session = token ? ((await supabase.rpc("staff_session", { p_token: token })).data as GateSession | null) : null

  if (!session) {
    const { userId } = await getUserId()
    return (
      <div className="wrap--narrow">
        <div className="pagehead" data-hero>
          <div>
            <span className="kicker" data-rise><Icon name="qr-code" size={18} />Gate check-in</span>
            <h1 style={{ marginTop: 10 }} data-lines><span className="line"><span>Sign in to scan tickets</span></span></h1>
            <p className="muted" data-rise>Use the username and password your event host gave you.</p>
          </div>
        </div>
        <div className="card" data-reveal>
          <GateLoginForm />
        </div>
        {userId && <p className="small muted" style={{ marginTop: 16 }}>Hosting? Open the scanner from your event&rsquo;s Gate check-in card in <Link href="/dashboard/events">My events</Link>.</p>}
      </div>
    )
  }

  return (
    <div className="wrap--narrow">
      <div className="pagehead" data-hero>
        <div>
          <span className="kicker" data-rise><Icon name="qr-code" size={18} />{session.host_name} · gate</span>
          <h1 style={{ marginTop: 10 }} data-lines><span className="line"><span>Hi {session.name.split(/\s+/)[0]}</span></span></h1>
          <p className="muted" data-rise>Pick the event you&rsquo;re checking in.</p>
        </div>
        <form action={gateLogout}>
          <button type="submit" className="btn btn--ghost btn--sm btn--plain">Sign out</button>
        </form>
      </div>
      {session.events.length === 0 ? (
        <div className="card"><p className="muted">You don&rsquo;t have any events to check in right now. Your host assigns events to your account.</p></div>
      ) : (
        <div className="evlist">
          {session.events.map((e) => (
            <div key={e.id} data-reveal>
              <Link href={`/gate/${e.id}`} className="evrow">
                <span className="datebox"><b>{formatDate(e.starts_at, { day: "numeric" })}</b><span>{formatDate(e.starts_at, { month: "short" })}</span></span>
                <span>
                  <span className="evrow__t">{e.title}</span>
                  <span className="evrow__m" style={{ display: "block" }}>{formatTime(e.starts_at)} · {e.venue}, {e.city} · {e.checked_in} of {e.total} in</span>
                </span>
                <span className="btn__arrow" aria-hidden="true"><Icon name="arrow" /></span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
