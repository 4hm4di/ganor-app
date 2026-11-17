"use client"

import { useEffect, useRef } from "react"
import { useFormStatus } from "react-dom"
import { Icon } from "./Icon"
import { Loader } from "./Loader"
import { confirmAction } from "./confirm-action"

// Destructive submit (Delete, Remove): tapping it opens a confirm sheet that says what will happen.
// The sheet is a native <dialog> inside the same form, so it shows above everything on any screen
// and its button submits the form it belongs to. While the action runs it shows progress, and the
// rest of the form waits.
export function ConfirmButton({
  children,
  title,
  body = "This can't be undone.",
  confirmLabel = "Delete",
  pendingText,
  formAction,
  className = "btn btn--danger btn--sm btn--plain",
}: {
  children: React.ReactNode
  title: string
  body?: React.ReactNode
  confirmLabel?: string
  pendingText: string
  formAction?: (fd: FormData) => void | Promise<void>
  className?: string
}) {
  const dlg = useRef<HTMLDialogElement>(null)
  const { pending: formPending, action } = useFormStatus()
  const own = formAction ? confirmAction(formAction) : undefined
  // Only show progress when this button sent the form; a Save in the same form just disables it.
  const pending = formPending && (own ? action === own : true)

  // The form shows it's busy while this runs; the sheet closes when it's done (if still on screen).
  const was = useRef(false)
  useEffect(() => {
    const form = dlg.current?.closest("form")
    if (pending) form?.setAttribute("data-busy", "confirm")
    else form?.removeAttribute("data-busy")
    if (was.current && !pending) dlg.current?.close()
    was.current = pending
  }, [pending])

  const close = () => { if (!pending) dlg.current?.close() }

  return (
    <>
      <button type="button" className={className} onClick={() => dlg.current?.showModal()} disabled={formPending} aria-haspopup="dialog">
        {pending ? <><Loader size={18} /><span>{pendingText}</span></> : children}
      </button>
      <dialog
        ref={dlg}
        className="cdlg"
        aria-label={title}
        onCancel={(e) => { if (pending) e.preventDefault() }}
        onClick={(e) => { if (e.target === dlg.current) close() }}
      >
        <div className="chooser__panel confirmd__panel">
          <span className="confirmd__ic" aria-hidden="true"><Icon name="close-circle" size={26} /></span>
          <b>{title}</b>
          <p>{body}</p>
          <div className="confirmd__btns">
            <button type="button" className="btn btn--ghost btn--plain" onClick={close} disabled={pending}>Cancel</button>
            <button type="submit" formAction={own} className="btn btn--danger btn--plain" disabled={formPending} aria-live="polite">
              {pending ? <><Loader size={18} /><span>{pendingText}</span></> : confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
