"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Icon } from "./Icon"

// Sign out asks first, so a stray tap in a menu never ends a session by accident.
export function SignOutButton({ action = "/auth/signout", className = "acct__item acct__item--danger", icon = true, label = "Sign out" }: { action?: string | ((fd: FormData) => void | Promise<void>); className?: string; icon?: boolean; label?: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) setOpen(false) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, busy])

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} aria-haspopup="dialog">
        {icon && <Icon name="close-circle" size={18} />}{label}
      </button>
      {open && createPortal(
        <div className="chooser confirmd" role="alertdialog" aria-modal="true" aria-labelledby="so-t" aria-describedby="so-d" onMouseDown={(e) => { e.stopPropagation(); if (e.target === e.currentTarget && !busy) setOpen(false) }}>
          <form className="chooser__panel confirmd__panel" action={action} method={typeof action === "string" ? "post" : undefined} onSubmit={() => setBusy(true)}>
            <span className="confirmd__ic" aria-hidden="true"><Icon name="close-circle" size={26} /></span>
            <b id="so-t">Sign out?</b>
            <p id="so-d">You&rsquo;ll need your email or username and password to sign back in.</p>
            <div className="confirmd__btns">
              <button type="button" ref={cancelRef} className="btn btn--ghost btn--plain" onClick={() => setOpen(false)} disabled={busy}>Stay signed in</button>
              <button type="submit" className="btn btn--danger btn--plain" disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button>
            </div>
          </form>
        </div>,
        document.body,
      )}
    </>
  )
}
