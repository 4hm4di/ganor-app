"use client"

import { useId, useState } from "react"

export type PickOption = { id: string; label: string; meta?: string; tags?: string[]; disabled?: boolean; why?: string }

// Inline checklist: every choice is visible and one tap away (no dropdown to open).
// Checked boxes submit under `name`. A search box appears once the list gets long.
export function CheckPick({ name, label, help, options, defaultValue = [], empty, noun = "event" }: { name: string; label: string; help?: string; options: PickOption[]; defaultValue?: string[]; empty?: string; noun?: string }) {
  const [sel, setSel] = useState<string[]>(defaultValue.filter((v) => options.some((o) => o.id === v)))
  const [q, setQ] = useState("")
  const id = useId()
  const open = (o: PickOption) => !o.disabled || sel.includes(o.id)
  const pickable = options.filter(open)
  const shown = (o: PickOption) => !q.trim() || `${o.label} ${o.meta ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())
  const toggle = (v: string) => setSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))
  const none = options.every((o) => !shown(o))

  return (
    <fieldset className="pick" aria-describedby={help ? `${id}-h` : undefined}>
      <legend className="pick__label">
        <span>{label}</span>
        {options.length > 0 && <span className={`pick__count${sel.length ? " is-on" : ""}`} aria-live="polite">{sel.length === 0 ? "None chosen" : `${sel.length} of ${pickable.length} chosen`}</span>}
      </legend>
      {options.length === 0 ? <p className="pick__empty">{empty ?? "Nothing to choose yet."}</p> : (
        <>
          {options.length > 5 && <input type="search" className="pick__search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${noun}s…`} aria-label={`Search ${noun}s`} autoComplete="off" />}
          <div className={`pick__list${options.length > 5 ? " pick__list--scroll" : ""}`}>
            {options.map((o) => {
              const on = sel.includes(o.id)
              const off = !open(o)
              return (
                <label key={o.id} className={`pick__opt${on ? " is-on" : ""}${off ? " is-off" : ""}`} hidden={!shown(o)}>
                  <input type="checkbox" name={name} value={o.id} checked={on} disabled={off} onChange={() => toggle(o.id)} />
                  <span className="pick__text">
                    <b>{o.label}</b>
                    {o.meta && <small>{o.meta}</small>}
                    {(o.tags?.length || (off && o.why)) ? (
                      <span className="pick__tags">
                        {o.tags?.map((t) => <span key={t} className="badge">{t}</span>)}
                        {off && o.why && <span className="badge badge--warn">{o.why}</span>}
                      </span>
                    ) : null}
                  </span>
                </label>
              )
            })}
            {none && <p className="pick__empty">No {noun} matches &ldquo;{q}&rdquo;.</p>}
          </div>
          {pickable.length > 1 && (
            <div className="pick__tools">
              <button type="button" className="linkbtn" onClick={() => setSel(pickable.map((o) => o.id))}>Choose all</button>
              <button type="button" className="linkbtn" onClick={() => setSel([])} disabled={sel.length === 0}>Clear</button>
            </div>
          )}
        </>
      )}
      {help && <p className="pick__help" id={`${id}-h`}>{help}</p>}
    </fieldset>
  )
}
