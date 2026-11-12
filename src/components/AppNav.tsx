"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Icon } from "./Icon"
import { IdleGuard } from "./IdleGuard"

type Props = { name: string; email: string; logo: string | null; staff: boolean }

const initials = (s: string) => s.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("")

// Signed-in header: section links, an account menu with Sign out, and a full-screen menu on phones.
export function AppNav({ name, email, logo, staff }: Props) {
  const path = usePathname()
  const [menu, setMenu] = useState(false) // account dropdown (desktop)
  const [sheet, setSheet] = useState(false) // full menu (phone)
  const menuRef = useRef<HTMLDivElement>(null)

  const links = [
    { href: "/dashboard", label: "My events", icon: "calendar", match: (p: string) => p === "/dashboard" || p.startsWith("/dashboard/events") },
    { href: "/dashboard/team", label: "Gate team", icon: "users", match: (p: string) => p.startsWith("/dashboard/team") },
    { href: "/dashboard/profile", label: "Profile", icon: "user", match: (p: string) => p.startsWith("/dashboard/profile") },
    ...(staff ? [{ href: "/admin", label: "Admin", icon: "shield", match: (p: string) => p.startsWith("/admin") }] : []),
  ]

  // Close menus on navigation, outside click and Escape.
  useEffect(() => {
    const t = setTimeout(() => { setMenu(false); setSheet(false) }, 0)
    return () => clearTimeout(t)
  }, [path])
  useEffect(() => {
    if (!menu && !sheet) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenu(false); setSheet(false) } }
    const onClick = (e: MouseEvent) => { if (menu && menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false) }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClick)
    document.documentElement.classList.toggle("is-locked", sheet)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClick)
      document.documentElement.classList.remove("is-locked")
    }
  }, [menu, sheet])

  const avatar = logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo} alt="" width={32} height={32} />
  ) : (
    <span>{initials(name)}</span>
  )

  const signOut = (
    <form action="/auth/signout" method="post">
      <button type="submit" className="acct__item acct__item--danger"><Icon name="close-circle" size={18} />Sign out</button>
    </form>
  )

  return (
    <header className="topbar topbar--app">
      <IdleGuard />
      <div className="wrap topbar__in">
        <Link href="/dashboard" className="topbar__logo" aria-label="Ganor dashboard">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/ganor-lockup-indigo.svg" alt="Ganor" width={118} height={22} />
        </Link>

        <nav className="appnav" aria-label="Dashboard">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`appnav__l${l.match(path) ? " is-on" : ""}`} aria-current={l.match(path) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="topbar__end">
          <Link href="/dashboard/events/new" className="btn btn--primary btn--sm topbar__new" aria-label="New event">
            <span>New event</span>
            <span className="btn__arrow" aria-hidden="true"><Icon name="add-circle" /></span>
          </Link>

          <div className="acct" ref={menuRef}>
            <button type="button" className="acct__btn" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
              <span className="acct__av">{avatar}</span>
              <span className="acct__name">{name.split(/\s+/)[0]}</span>
              <Icon name="arrow-down" size={16} />
            </button>
            {menu && (
              <div className="acct__menu" role="menu">
                <div className="acct__who"><b>{name}</b>{email && <small>{email}</small>}</div>
                <Link href="/dashboard/profile" className="acct__item" role="menuitem"><Icon name="user" size={18} />Host profile</Link>
                <Link href="/events" className="acct__item" role="menuitem"><Icon name="search" size={18} />Find events</Link>
                <a href="/" className="acct__item" role="menuitem"><Icon name="home" size={18} />Ganor homepage</a>
                {signOut}
              </div>
            )}
          </div>

          <button type="button" className="burger" aria-label="Open menu" aria-expanded={sheet} onClick={() => setSheet(true)}>
            <i /><i />
          </button>
        </div>
      </div>

      {sheet && createPortal(
        <div className="appsheet" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="appsheet__top">
            <span className="acct__av acct__av--lg">{avatar}</span>
            <span className="acct__who"><b>{name}</b>{email && <small>{email}</small>}</span>
            <button type="button" className="iconbtn appsheet__close" aria-label="Close menu" onClick={() => setSheet(false)}>
              <Icon name="close-circle" size={22} />
            </button>
          </div>
          <nav className="appsheet__links" aria-label="Dashboard">
            {links.map((l, i) => (
              <Link key={l.href} href={l.href} className={`appsheet__l${l.match(path) ? " is-on" : ""}`} style={{ "--i": i } as React.CSSProperties}>
                <Icon name={l.icon} size={22} />{l.label}
              </Link>
            ))}
            <Link href="/dashboard/events/new" className="appsheet__l" style={{ "--i": links.length } as React.CSSProperties}><Icon name="add-circle" size={22} />New event</Link>
            <Link href="/events" className="appsheet__l" style={{ "--i": links.length + 1 } as React.CSSProperties}><Icon name="search" size={22} />Find events</Link>
          </nav>
          <div className="appsheet__foot">{signOut}</div>
        </div>,
        document.body,
      )}
    </header>
  )
}
