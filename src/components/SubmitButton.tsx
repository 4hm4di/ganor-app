"use client"

import { useFormStatus } from "react-dom"
import { Icon } from "./Icon"
import { Loader } from "./Loader"
import { isConfirmAction } from "./confirm-action"

export function SubmitButton({
  children,
  pendingText = "Saving…",
  variant = "primary",
  size,
  arrow = true,
  name,
  value,
  block = false,
  disabled = false,
}: {
  children: React.ReactNode
  pendingText?: string
  variant?: "primary" | "outline" | "ghost" | "danger"
  size?: "sm" | "xs"
  arrow?: boolean
  name?: string
  value?: string
  block?: boolean
  disabled?: boolean
}) {
  const { pending: formPending, action } = useFormStatus()
  // When a ConfirmButton (e.g. Delete) in the same form is running, this button just waits.
  const pending = formPending && !isConfirmAction(action)
  const cls = ["btn", `btn--${variant}`, size ? `btn--${size}` : "", block ? "btn--block" : "", arrow ? "" : "btn--plain"].join(" ")
  return (
    <button type="submit" className={cls} disabled={formPending || disabled} aria-disabled={formPending || disabled} name={name} value={value}>
      {pending && !arrow && <Loader size={22} />}
      <span>{pending ? pendingText : children}</span>
      {arrow && (
        <span className="btn__arrow" aria-hidden="true">
          {pending ? <Loader size={22} /> : <Icon name="arrow" />}
        </span>
      )}
    </button>
  )
}
