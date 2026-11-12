"use client"

import { useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader } from "./Loader"

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
  const { pending } = useFormStatus()
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button
      type="submit"
      className={`${className}${armed ? " is-armed" : ""}`}
      formAction={formAction}
      disabled={pending}
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
