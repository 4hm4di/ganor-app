"use client"

import { useId, useState } from "react"

// Rough strength score: length matters most, then variety. Common patterns knock it down.
export function passwordScore(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length
  if (kinds >= 2) s++
  if (kinds >= 3 && pw.length >= 10) s++
  if (/^(.)\1+$/.test(pw) || /(password|qwerty|123456|ganor|abc123|111111)/i.test(pw)) s = Math.min(s, 1)
  if (pw.length < 8) s = Math.min(s, 1)
  return s as 0 | 1 | 2 | 3 | 4
}
const LABELS = ["", "Weak", "Fair", "Good", "Strong"]

const Eye = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
)

export function PasswordField({
  name = "password", label = "Password", hint, autoComplete = "current-password", minLength, required = true, meter = false, labelExtra, enterKeyHint, value, onChange,
}: {
  name?: string; label?: string; hint?: string; autoComplete?: string; minLength?: number; required?: boolean; meter?: boolean
  labelExtra?: React.ReactNode; enterKeyHint?: "go" | "next" | "done"; value?: string; onChange?: (v: string) => void
}) {
  const [show, setShow] = useState(false)
  const [own, setOwn] = useState("")
  const pw = value ?? own
  const id = useId()
  const score = passwordScore(pw)
  return (
    <div className="field">
      <span className="field__label field__label--row"><label htmlFor={id}>{label}{hint && <small> ({hint})</small>}</label>{labelExtra}</span>
      <span className="pw">
        <input
          id={id} type={show ? "text" : "password"} name={name} required={required} minLength={minLength} autoComplete={autoComplete}
          enterKeyHint={enterKeyHint} value={pw} onChange={(e) => (onChange ? onChange(e.target.value) : setOwn(e.target.value))}
          aria-describedby={meter ? `${id}-m` : undefined} spellCheck={false} autoCapitalize="none"
        />
        <button type="button" className="pw__eye" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
          <Eye off={show} />
        </button>
      </span>
      {meter && (
        <span className={`pwm pwm--${score}`} id={`${id}-m`} aria-live="polite">
          <span className="pwm__bars" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="pwm__t">{pw ? `${LABELS[score]}${score < 3 ? " · use 12+ characters with numbers and a symbol" : ""}` : `Use at least ${minLength ?? 8} characters. Longer is stronger.`}</span>
        </span>
      )}
    </div>
  )
}
