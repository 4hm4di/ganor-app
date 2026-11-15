import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { Icon } from "@/components/Icon"

export const metadata: Metadata = {
  title: "Ganor for hosts: sign in or create an account",
  description: "Sign in to Ganor or create your host account. Sell tickets, take free RSVPs and check guests in at the gate.",
  alternates: { canonical: "https://app.ganor.ng/" },
}

// app.ganor.ng is where hosts and gate teams work; the public homepage lives at ganor.ng.
// Signed-in hosts go straight to their dashboard.
export default async function AppHome() {
  const { userId } = await getUserId()
  if (userId) redirect("/dashboard")

  return (
    <div className="authpage wrap">
      <aside className="authpage__brand" aria-hidden="true">
        <div className="authpage__panel">
          <span className="kicker kicker--light">Ganor for hosts</span>
          <p className="authpage__big">Sell tickets, take RSVPs and check guests in, all from your phone.</p>
          <ul className="authpage__list">
            <li><Icon name="ticket" size={18} />Paid tickets and free RSVPs</li>
            <li><Icon name="qr-code" size={18} />Gate scanner for your team</li>
            <li><Icon name="wallet" size={18} />Payouts straight to your bank</li>
          </ul>
        </div>
      </aside>
      <div className="authpage__form">
        <a href="https://ganor.ng" className="authback"><Icon name="arrow-right" size={16} />ganor.ng</a>
        <div className="pagehead" data-hero>
          <div>
            <span className="kicker" data-rise>For hosts</span>
            <h1 style={{ marginTop: 10 }} data-lines><span className="line"><span>Host on Ganor</span></span></h1>
            <p className="muted" data-rise>Create your event in minutes, share one link and scan guests in at the gate. Free to start.</p>
          </div>
        </div>
        <div className="card apphome" data-reveal>
          <Link href="/login?mode=signup" className="btn btn--primary apphome__btn">
            <span>Create a host account</span>
            <span className="btn__arrow" aria-hidden="true"><Icon name="arrow" /></span>
          </Link>
          <Link href="/login" className="btn btn--outline apphome__btn"><span>Sign in</span></Link>
          <ul className="apphome__more">
            <li><Icon name="scan" size={18} /><span>On a gate team? <Link href="/gate">Sign in to scan tickets</Link></span></li>
            <li><Icon name="calendar" size={18} /><span>Going to an event? <Link href="/events">Find events</Link></span></li>
            <li><Icon name="info" size={18} /><span>New to Ganor? <a href="https://ganor.ng">See how it works</a></span></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
