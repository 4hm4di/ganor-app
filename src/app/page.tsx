import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, getUserId } from "@/lib/supabase/server"
import { Icon } from "@/components/Icon"
import { formatDate, formatTime } from "@/lib/ganor"

export default async function Home() {
  const { userId } = await getUserId()
  if (userId) redirect("/dashboard")

  const supabase = await createClient()
  const { data: events } = await supabase
    .from("events")
    .select("slug, title, city, venue_name, starts_at")
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(6)

  return (
    <div className="wrap">
      <section className="hero">
        <span className="kicker"><Icon name="ticket" size={18} />Ganor for hosts</span>
        <h1>Host it. Fill it. Scan them in.</h1>
        <p>Create your event, set your tickets and share one link. Guests pay by card, transfer or USSD and get their ticket on WhatsApp.</p>
        <div className="actions">
          <Link href="/login" className="btn btn--primary">
            <span>Start hosting</span>
            <span className="btn__arrow" aria-hidden="true"><Icon name="arrow" /></span>
          </Link>
          <a href="https://ganor.ng" className="btn btn--outline">
            <span>About Ganor</span>
            <span className="btn__arrow" aria-hidden="true"><Icon name="arrow" /></span>
          </a>
        </div>
      </section>

      <div className="steps">
        <div className="step"><Icon name="pen" size={32} /><h3>Create your event</h3><p>Name, date, venue and the ticket types you need. Free events cost nothing.</p></div>
        <div className="step"><Icon name="share" size={32} /><h3>Share one link</h3><p>Publish when you&rsquo;re ready and send your event page anywhere.</p></div>
        <div className="step"><Icon name="scan" size={32} /><h3>Scan them in</h3><p>Check guests in at the gate with any phone.</p></div>
      </div>

      {events && events.length > 0 && (
        <section style={{ marginTop: 56 }}>
          <h2 className="section-t" style={{ marginBottom: 16 }}>Coming up</h2>
          <div className="evlist">
            {events.map((e) => (
              <Link key={e.slug} href={`/e/${e.slug}`} className="evrow">
                <span className="datebox"><b>{formatDate(e.starts_at, { day: "numeric" })}</b><span>{formatDate(e.starts_at, { month: "short" })}</span></span>
                <span>
                  <span className="evrow__t">{e.title}</span>
                  <span className="evrow__m" style={{ display: "block" }}>{e.venue_name}, {e.city} · {formatTime(e.starts_at)}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
