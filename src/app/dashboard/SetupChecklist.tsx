import Link from "next/link"
import { Icon } from "@/components/Icon"
import { SubmitButton } from "@/components/SubmitButton"
import { setSetupHidden } from "./actions"

export type SetupStep = { key: string; title: string; why: string; href: string; icon: string; done: boolean; optional?: boolean; cta: string }

export type SetupFacts = {
  logo: boolean; bio: boolean; contact: boolean; payout: boolean; team: boolean
  events: number; published: number; guests: number; firstDraft: string | null; firstLive: string | null
}

// The new-host to-do list: what's left to finish setting up, in the order that makes sense.
export function setupSteps(f: SetupFacts): SetupStep[] {
  return [
    { key: "contact", title: "Add a WhatsApp or call number", why: "Guests use it to reach you. You need it before you can publish.", href: "/dashboard/profile#contact", icon: "phone", done: f.contact, cta: "Add number" },
    { key: "logo", title: "Add your logo or photo", why: "Shown on your event pages so guests know who's hosting.", href: "/dashboard/profile#logo", icon: "image", done: f.logo, cta: "Add logo" },
    { key: "bio", title: "Say a line about you", why: "A short intro under your name on every event page.", href: "/dashboard/profile#about", icon: "pen", done: f.bio, optional: true, cta: "Write it" },
    { key: "event", title: "Create your first event", why: "Free RSVP or paid tickets. It stays a draft until you publish.", href: "/dashboard/events/new", icon: "add-circle", done: f.events > 0, cta: "Create event" },
    { key: "publish", title: "Publish it", why: "Pick public (listed on Find events) or private (link only). Then you get your link.", href: f.firstDraft ? `/dashboard/events/${f.firstDraft}` : "/dashboard/events", icon: "send", done: f.published > 0, cta: "Open event" },
    { key: "share", title: "Share your link and get your first guest", why: "Send it on WhatsApp, X or Facebook. Your first RSVP or sale ticks this off.", href: f.firstLive ? `/dashboard/events/${f.firstLive}#share` : "/dashboard/events", icon: "share", done: f.guests > 0, cta: "Share link" },
    { key: "payout", title: "Add your payout account", why: "Where money from paid tickets goes. Skip it if you only host free events.", href: "/dashboard/profile#payouts", icon: "wallet", done: f.payout, optional: true, cta: "Add account" },
    { key: "team", title: "Add your gate team", why: "People who scan tickets at the door, each with their own login.", href: "/dashboard/team", icon: "users", done: f.team, optional: true, cta: "Add someone" },
  ]
}

export function SetupChecklist({ steps, first, welcome }: { steps: SetupStep[]; first?: string; welcome: boolean }) {
  const done = steps.filter((s) => s.done).length
  const next = steps.find((s) => !s.done && !s.optional) ?? steps.find((s) => !s.done)
  return (
    <section className="card setup" aria-labelledby="setup-title" data-reveal>
      <header className="setup__head">
        <div>
          <span className="kicker"><Icon name="check-circle" size={16} />Your to-do list</span>
          <h2 id="setup-title">{welcome ? `Welcome to Ganor${first ? `, ${first}` : ""}` : "Finish setting up"}</h2>
          <p className="muted small">{done === 0 ? "A few quick steps to get your first guests. About 5 minutes." : `${done} of ${steps.length} done. ${steps.length - done} to go.`}</p>
        </div>
        <form action={setSetupHidden}>
          <input type="hidden" name="hide" value="1" />
          <SubmitButton variant="ghost" size="xs" arrow={false} pendingText="Hiding…">Hide list</SubmitButton>
        </form>
      </header>
      <div className="setup__bar" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label="Setup progress"><i style={{ "--w": done / steps.length } as React.CSSProperties} /></div>
      {done > 0 && (
        <ul className="setup__done" aria-label="Done">
          {steps.filter((s) => s.done).map((s) => <li key={s.key}><Icon name="check-circle" size={16} />{s.title}</li>)}
        </ul>
      )}
      <ol className="setup__list">
        {steps.filter((s) => !s.done).sort((a, b) => Number(!!a.optional) - Number(!!b.optional)).map((s) => {
          const isNext = s.key === next?.key
          return (
            <li key={s.key} className={`setup__i${s.done ? " is-done" : ""}${isNext ? " is-next" : ""}`}>
              <span className="setup__ic" aria-hidden="true"><Icon name={s.done ? "check-circle" : s.icon} size={20} /></span>
              <span className="setup__t">
                <b>{s.title}{s.optional && !s.done && <small className="setup__opt">Optional</small>}</b>
                {!s.done && <small>{s.why}</small>}
              </span>
              {s.done ? <span className="sr-only">Done</span> : (
                <Link href={s.href} className={`btn btn--xs ${isNext ? "btn--primary" : "btn--ghost"} btn--plain`}>{s.cta}<Icon name="arrow-right" size={16} /></Link>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
