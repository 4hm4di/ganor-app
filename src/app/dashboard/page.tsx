import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { Icon } from "@/components/Icon"
import { HostRating } from "@/components/HostRating"
import { formatDate, formatTime } from "@/lib/ganor"

export const metadata: Metadata = { title: "My events" }

const STATUS_LABEL: Record<string, string> = { draft: "Draft", published: "Live", cancelled: "Cancelled" }

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const sp = await searchParams
  const { supabase, userId } = await getUserId()
  if (!userId) redirect("/login")

  const [{ data: profile }, { data: events }, { data: rating }, { data: staff }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).single(),
    supabase
      .from("events")
      .select("id, title, city, venue_name, starts_at, status, cover_url, ticket_types(quantity, sold)")
      .eq("host_id", userId)
      .order("starts_at", { ascending: true }),
    supabase.from("host_review_summary").select("*").eq("host_id", userId).maybeSingle(),
    supabase.rpc("is_staff"),
  ])

  const first = profile?.display_name?.split(/\s+/)[0]

  return (
    <div className="wrap">
      <div className="pagehead">
        <div>
          <span className="kicker"><Icon name="calendar" size={18} />Host dashboard</span>
          <h1 style={{ marginTop: 10 }}>{first ? `Hi ${first}` : "Your events"}</h1>
          <p className="muted">Create an event, add tickets, then publish to get your link.</p>
          <div style={{ marginTop: 10 }}><HostRating summary={rating} /></div>
          <p className="small muted">Guests scanned at the gate rate you after your event. Your average shows once you have 5.</p>
          {staff && <p className="small" style={{ marginTop: 6 }}><Link href="/admin/ratings">Ganor staff: rating requests and reports</Link></p>}
        </div>
        <Link href="/dashboard/events/new" className="btn btn--primary">
          <span>New event</span>
          <span className="btn__arrow" aria-hidden="true"><Icon name="arrow" /></span>
        </Link>
      </div>

      {sp.password === "updated" && (
        <div className="alert alert--ok" role="status" style={{ marginBottom: 16 }}><Icon name="check-circle" /><span>Your password was updated.</span></div>
      )}
      {!events?.length ? (
        <div className="card empty">
          <Icon name="ticket" size={48} />
          <h2>No events yet</h2>
          <p>Your first event takes about two minutes. You can keep it as a draft until you&rsquo;re ready.</p>
          <Link href="/dashboard/events/new" className="btn btn--primary">
            <span>Create your first event</span>
            <span className="btn__arrow" aria-hidden="true"><Icon name="arrow" /></span>
          </Link>
        </div>
      ) : (
        <div className="evlist">
          {events.map((e) => {
            const total = e.ticket_types.reduce((n, t) => n + t.quantity, 0)
            const sold = e.ticket_types.reduce((n, t) => n + t.sold, 0)
            return (
              <Link key={e.id} href={`/dashboard/events/${e.id}`} className="evrow">
                <span className={`datebox${e.cover_url ? " datebox--img" : ""}`}>
                  {e.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.cover_url} alt="" width={128} height={64} loading="lazy" />
                  )}
                  <b>{formatDate(e.starts_at, { day: "numeric" })}</b>
                  <span>{formatDate(e.starts_at, { month: "short" })}</span>
                </span>
                <span>
                  <span className="evrow__t">{e.title}</span>
                  <span className="evrow__m" style={{ display: "block" }}>
                    {e.city} · {formatTime(e.starts_at)} · {e.ticket_types.length ? `${sold} of ${total} tickets` : "No tickets yet"}
                  </span>
                </span>
                <span className={`pill pill--${e.status}`}>{STATUS_LABEL[e.status] ?? e.status}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
