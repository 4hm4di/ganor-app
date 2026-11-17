"use client"

import { useFormStatus } from "react-dom"

// A non-submit button inside a form (Cancel, Back) that waits while the form is being sent.
export function FormIdleButton({ children, onClick, className = "btn btn--ghost btn--xs btn--plain" }: { children: React.ReactNode; onClick: () => void; className?: string }) {
  const { pending } = useFormStatus()
  return <button type="button" className={className} onClick={onClick} disabled={pending} aria-disabled={pending}>{children}</button>
}
