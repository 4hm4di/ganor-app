"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Icon } from "./Icon"

type Opt = { id: string; label: string; hint?: string; disabled?: boolean }

// Dropdown with checkboxes. Submits one hidden input per chosen value, under `name`.
export function MultiSelect({ name, label, options, defaultValue = [], placeholder = "Choose…", empty }: { name: string; label: string; options: Opt[]; defaultValue?: string[]; placeholder?: string; empty?: string }) {
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState<string[]>(defaultValue.filter((v) => options.some((o) => o.id === v)))
  const box = useRef<HTMLDivElement>(null)
  const id = useId()
  useEffect(() => {
    if (!open) return
    const out = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", out)
    document.addEventListener("keydown", esc)
    return () => { document.removeEventListener("mousedown", out); document.removeEventListener("keydown", esc) }
  }, [open])
  const summary = sel.length === 0 ? placeholder : sel.length === 1 ? options.find((o) => o.id === sel[0])?.label ?? "1 selected" : `${sel.length} events selected`
  const toggle = (v: string) => setSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))

  return (
    <div className="field msel" ref={box}>
      <span className="field__label" id={`${id}-l`}>{label}</span>
      {sel.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
      {options.length === 0 ? <p className="small muted">{empty ?? "Nothing to choose yet."}</p> : (
        <>
          <button type="button" className={`msel__btn${sel.length ? "" : " is-empty"}`} aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${id}-l ${id}-v`} onClick={() => setOpen((o) => !o)}>
            <span id={`${id}-v`}>{summary}</span>
            <Icon name="arrow-down" size={18} />
          </button>
          {open && (
            <div className="msel__menu" role="listbox" aria-multiselectable="true" aria-labelledby={`${id}-l`}>
              <div className="msel__tools">
                <button type="button" className="linkbtn" onClick={() => setSel(options.filter((o) => !o.disabled || sel.includes(o.id)).map((o) => o.id))}>Select all</button>
                <button type="button" className="linkbtn" onClick={() => setSel([])}>Clear</button>
              </div>
              {options.map((o) => (
                <label key={o.id} className={`msel__opt${o.disabled && !sel.includes(o.id) ? " is-off" : ""}`} role="option" aria-selected={sel.includes(o.id)} aria-disabled={o.disabled && !sel.includes(o.id) ? true : undefined}>
                  <input type="checkbox" checked={sel.includes(o.id)} disabled={o.disabled && !sel.includes(o.id)} onChange={() => toggle(o.id)} />
                  <span><b>{o.label}</b>{o.hint && <small>{o.hint}</small>}</span>
                </label>
              ))}
              <button type="button" className="btn btn--primary btn--xs btn--plain msel__done" onClick={() => setOpen(false)}>Done</button>
            </div>
          )}
          {sel.length > 1 && <span className="msel__chips">{sel.map((v) => <span key={v} className="badge">{options.find((o) => o.id === v)?.label}</span>)}</span>}
        </>
      )}
    </div>
  )
}
