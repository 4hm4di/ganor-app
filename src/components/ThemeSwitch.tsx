"use client"

import { useSyncExternalStore } from "react"

export type Theme = "system" | "light" | "dark"
const COOKIE = "ganor_theme"
const EVENT = "ganor-theme"

function read(): Theme {
  const m = document.cookie.match(/(?:^|; )ganor_theme=(system|light|dark)/)
  return (m?.[1] as Theme) ?? "system"
}

// Applies the theme to <html>. The same logic runs before first paint (see layout.tsx).
export function applyTheme(t: Theme) {
  const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("theme-dark", dark)
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  return () => window.removeEventListener(EVENT, cb)
}

const ICONS: Record<Theme, React.ReactNode> = {
  system: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" strokeLinecap="round" /></svg>,
  light: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" /></svg>,
  dark: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" strokeLinejoin="round" /></svg>,
}

function setTheme(t: Theme) {
  document.cookie = `${COOKIE}=${t}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
  applyTheme(t)
  window.dispatchEvent(new Event(EVENT))
}

export function ThemeSwitch() {
  const theme = useSyncExternalStore(subscribe, read, () => "system" as Theme)
  return (
    <div className="themesw" role="group" aria-label="Appearance">
      {(["system", "light", "dark"] as Theme[]).map((t) => (
        <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)}>
          {ICONS[t]}
          {t === "system" ? "System" : t === "light" ? "Light" : "Dark"}
        </button>
      ))}
    </div>
  )
}
