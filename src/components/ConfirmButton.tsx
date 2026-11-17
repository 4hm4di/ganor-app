"use client"

import { useEffect, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader } from "./Loader"
import { confirmAction } from "./confirm-action"

// Destructive submit: the first tap arms it, the second tap within 4 seconds submits.
export function ConfirmButton({
  children,
  confirmText,
  pendingText,
  formAction,
  className = "btn btn--danger btn--sm btn--plain",
}: {
  children: React.ReactNode
  confirmText: string
  pendingText: string
  formAction?: (fd: FormData) => void | Promise<void>
  className?: string
}) {
  const [armed, setArmed] = useState(false)
  const { pending: formPending, action } = useFormStatus()
  const own = formAction ? confirmAction(formAction) : undefined
  // Only show progress when this button sent the form; a Save in the same form just disables it.
  const pending = formPending && (own ? action === own : true)
  const ref = useRef<HTMLButtonElement>(null)
  // While this button's action runs, the whole form shows it's busy (fields dim, nothing else to press).
  useEffect(() => {
    const form = ref.current?.form
    if (!form) return
    if (pending) form.setAttribute("data-busy", "confirm")
    else form.removeAttribute("data-busy")
  }, [pending])
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button
      ref={ref}
      type="submit"
      className={`${className}${armed ? " is-armed" : ""}`}
      formAction={own}
      disabled={formPending}
      aria-live="polite"
      onClick={(e) => {
        if (!armed) {
          e.preventDefault()
          setArmed(true)
        }
      }}
    >
      {pending && <Loader size={22} />}
      <span>{pending ? pendingText : armed ? confirmText : children}</span>
    </button>
  )
}
