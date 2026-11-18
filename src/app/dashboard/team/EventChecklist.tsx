"use client"

import Link from "next/link"
import { useId, useState } from "react"
import { Icon } from "@/components/Icon"
import type { TeamEvent } from "./TeamForms"

// Mini calendar tile: weekday, day, month.
export function DateTile({ e }: { e: Pick<TeamEvent, "wd" | "day" | "mon" | "live"> }) {
  return (
    <span className={`ecl__date${e.live ? " is-live" : ""}`} aria-hidden="true">
      <small>{e.wd}</small><b>{e.day}</b><small>{e.mon}</small>
    </span>
  )
}

const GROUPS: { key: "live" | "soon" | "draft"; title: string; note?: string }[] = [
  { key: "live", title: "Happening now" },
  { key: "soon", title: "Coming up" },
  { key: "draft", title: "Drafts", note: "They appear on the gate phone once you publish." },
]
const groupOf = (e: TeamEvent) => (e.draft ? "draft" : e.live ? "live" : "soon")

// "Events they can check in": the host's events that are open for check-in (or drafts, ready for
// when they publish), grouped and dated so the right ones are easy to find and tick.
export function EventChecklist({ events, selected = [], staffId }: { events: TeamEvent[]; selected?: string[]; staffId?: string }) {
  const id = useId()
  // A free RSVP event allows one gate account; if someone else has it, it can't be ticked here.
  const takenBy = (e: TeamEvent) => (e.heldBy && e.heldBy !== staffId ? e.heldByName ?? "Someone" : null)
  const [sel, setSel] = useState<string[]>(selected.filter((v) => events.some((e) => e.id === v)))
  const [q, setQ] = useState("")
  const pickable = events.filter((e) => !takenBy(e))
  const match = (e: TeamEvent) => !q.trim() || `${e.label} ${e.venue} ${e.when}`.toLowerCase().includes(q.trim().toLowerCase())
  const toggle = (v: string) => setSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))
  const visible = events.filter(match)

  if (events.length === 0) {
    return (
      <div className="ecl">
        <p className="ecl__label">Events they can check in</p>
        <div className="ecl__empty">
          <Icon name="calendar" size={24} />
          <span><b>No events to check in yet</b><small>Create an event and it shows up here. You can tick drafts before you publish.</small></span>
          <Link href="/dashboard/events/new" className="btn btn--primary btn--xs btn--plain"><Icon name="add-circle" size={16} />Create event</Link>
        </div>
      </div>
    )
  }

  return (
    <fieldset className="ecl" aria-describedby={`${id}-h`}>
      <legend className="ecl__label">
        <span>Events they can check in</span>
        <span className={`ecl__count${sel.length ? " is-on" : ""}`} aria-live="polite">{sel.length === 0 ? "None ticked" : `${sel.length} ticked`}</span>
      </legend>
      <p className="ecl__help" id={`${id}-h`}>Tick the events this person scans at. Only these show on their phone, and you can change them any time.</p>

      <div className="ecl__bar">
        {events.length > 6 && (
          <label className="ecl__search">
            <Icon name="search" size={16} />
            <input type="search" value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Find an event" aria-label="Find an event" autoComplete="off" />
          </label>
        )}
        {pickable.length > 1 && (
          <span className="ecl__tools">
            <button type="button" className="linkbtn" onClick={() => setSel(pickable.map((e) => e.id))} disabled={sel.length === pickable.length}>Tick all</button>
            <button type="button" className="linkbtn" onClick={() => setSel([])} disabled={sel.length === 0}>Clear</button>
          </span>
        )}
      </div>

      <div className={`ecl__groups${events.length > 6 ? " ecl__groups--scroll" : ""}`}>
        {GROUPS.map((g) => {
          const list = visible.filter((e) => groupOf(e) === g.key)
          if (!list.length) return null
          return (
            <section key={g.key} className="ecl__group" aria-label={g.title}>
              <h4 className="ecl__gt">{g.key === "live" && <span className="ecl__dot" aria-hidden="true" />}{g.title} <small>{list.length}</small>{g.note && <em>{g.note}</em>}</h4>
              <ul className="ecl__list">
                {list.map((e) => {
                  const on = sel.includes(e.id)
                  const who = takenBy(e)
                  const off = !!who && !on
                  return (
                    <li key={e.id}>
                      <label className={`ecl__row${on ? " is-on" : ""}${off ? " is-off" : ""}`}>
                        <input type="checkbox" name="event_ids" value={e.id} checked={on} disabled={off} onChange={() => toggle(e.id)} />
                        <DateTile e={e} />
                        <span className="ecl__body">
                          <b>{e.label}</b>
                          <small>{e.time} · {e.venue}</small>
                          {(e.live || e.free || off) && (
                            <span className="ecl__notes">
                              {e.live && <span className="ecl__chip ecl__chip--live">Live now</span>}
                              {e.free && !off && <span className="ecl__chip">Free plan: 1 gate account</span>}
                              {off && <span className="ecl__chip ecl__chip--warn">{who} already scans this. Free plan allows 1 person.</span>}
                            </span>
                          )}
                        </span>
                        <span className="ecl__tick" aria-hidden="true">{off ? <Icon name="lock" size={14} /> : <svg viewBox="0 0 16 16" width="14" height="14"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
        {visible.length === 0 && <p className="ecl__none">No event matches &ldquo;{q}&rdquo;.</p>}
      </div>
    </fieldset>
  )
}

// Read-only list on each gate account card: the same events, in the same words.
export function AssignedEvents({ events, past, first }: { events: TeamEvent[]; past: number; first: string }) {
  if (events.length === 0) {
    return <span className="staffcard__none"><Icon name="warning" size={16} />Nothing to scan right now. Tap Edit and tick an event for {first}.</span>
  }
  return (
    <div className="ecl__assigned">
      <ul className="ecl__mini">
        {events.map((e) => (
          <li key={e.id}>
            <DateTile e={e} />
            <span className="ecl__body"><b>{e.label}</b><small>{e.draft ? "Draft: shows on their phone once published" : e.live ? "Live now: scanning open" : `${e.time} · ${e.venue}`}</small></span>
          </li>
        ))}
      </ul>
      {past > 0 && <small className="staffcard__past">Plus {past} past {past === 1 ? "event" : "events"}, closed for check-in</small>}
    </div>
  )
}
