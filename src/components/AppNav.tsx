"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Icon } from "./Icon"
import { IdleGuard } from "./IdleGuard"
import { ThemeSwitch } from "./ThemeSwitch"
import { NewEventChooser } from "./NewEventChooser"

type Props = { name: string; email: string; logo: string | null; staff: boolean; hqOnly?: boolean }

const initials = (s: string) => s.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("")

// Signed-in header: section links, an account menu with Sign out, and a full-screen menu on phones.
export function AppNav({ name, email, logo, staff, hqOnly }: Props) {
  const path = usePathname()
  const [menu, setMenu] = useState(false) // account dropdown (desktop)
  const [sheet, setSheet] = useState(false) // full menu (phone)
  const [chooser, setChooser] = useState(false) // "New event": RSVP or paid
  const menuRef = useRef<HTMLDivElement>(null)

  const links = [
    { href: "/dashboard", label: "Overview", icon: "home", match: (p: string) => p === "/dashboard" },
    { href: "/dashboard/events", label: "My events", icon: "calendar", match: (p: string) => p.startsWith("/dashboard/events") },
    { href: "/dashboard/team", label: "Gate team", icon: "users", match: (p: string) => p.startsWith("/dashboard/team") },
    { href: "/dashboard/profile", label: "Profile", icon: "user", match: (p: string) => p.startsWith("/dashboard/profile") },
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

  if ((staff && path.startsWith("/hq")) || hqOnly) {
    return (
      <header className="topbar topbar--hq">
        <IdleGuard />
        <div className="wrap topbar__in">
          <Link href="/hq" className="hqbrand" aria-label="Ganor HQ">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/ganor-lockup-white.svg" alt="Ganor" width={104} height={20} />
            <span>HQ</span>
          </Link>
          <div className="topbar__end">
            {!hqOnly && <Link href="/dashboard" className="hqlink">Host dashboard</Link>}
            <form action="/auth/signout?to=hq" method="post"><button type="submit" className="hqlink">Sign out</button></form>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="topbar topbar--app">
      <IdleGuard />
      <div className="wrap topbar__in">
        <Link href="/dashboard" className="topbar__logo" aria-label="Ganor dashboard">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-light" src="/brand/ganor-lockup-indigo.svg" alt="Ganor" width={118} height={22} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="logo-dark" src="/brand/ganor-lockup-white.svg" alt="Ganor" width={118} height={22} />
        </Link>

        <nav className="appnav" aria-label="Dashboard">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`appnav__l${l.match(path) ? " is-on" : ""}`} aria-current={l.match(path) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="topbar__end">
          <button type="button" className="btn btn--primary btn--sm topbar__new" onClick={() => setChooser(true)} aria-haspopup="dialog">
            <span>New event</span>
            <span className="btn__arrow" aria-hidden="true"><Icon name="add-circle" /></span>
          </button>

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
                <Link href="/dashboard/events" className="acct__item" role="menuitem"><Icon name="calendar" size={18} />My events</Link>
                <Link href="/dashboard/team" className="acct__item" role="menuitem"><Icon name="users" size={18} />Gate team</Link>
                <a href="/" className="acct__item" role="menuitem"><Icon name="home" size={18} />Ganor homepage</a>
                <div className="acct__theme"><small>Appearance</small><ThemeSwitch /></div>
                {signOut}
              </div>
            )}
          </div>

          <button type="button" className="newfab" aria-label="New event" title="New event" aria-haspopup="dialog" onClick={() => setChooser(true)}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button>
          <button type="button" className="burger" aria-label="Open menu" aria-expanded={sheet} onClick={() => setSheet(true)}>
            <i /><i />
          </button>
        </div>
      </div>

      {sheet && createPortal(
        <div className="appsheet" role="dialog" aria-modal="true" aria-label="Menu">
          {/* Same height and edge as the header, so the close button sits exactly where the menu button was. */}
          <div className="appsheet__bar">
            <Link href="/dashboard" className="topbar__logo" aria-label="Ganor dashboard">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="logo-light" src="/brand/ganor-lockup-indigo.svg" alt="Ganor" width={118} height={22} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="logo-dark" src="/brand/ganor-lockup-white.svg" alt="Ganor" width={118} height={22} />
            </Link>
            <button type="button" className="burger burger--x" aria-label="Close menu" onClick={() => setSheet(false)} autoFocus>
              <i /><i />
            </button>
          </div>
          <div className="appsheet__top">
            <span className="acct__av acct__av--lg">{avatar}</span>
            <span className="acct__who"><b>{name}</b>{email && <small>{email}</small>}</span>
          </div>
          <nav className="appsheet__links" aria-label="Dashboard">
            {links.map((l, i) => (
              <Link key={l.href} href={l.href} className={`appsheet__l${l.match(path) ? " is-on" : ""}`} style={{ "--i": i } as React.CSSProperties}>
                <Icon name={l.icon} size={22} />{l.label}
              </Link>
            ))}
            <button type="button" className="appsheet__l" style={{ "--i": links.length } as React.CSSProperties} onClick={() => { setSheet(false); setChooser(true) }}><Icon name="add-circle" size={22} />New event</button>
            <a href="/" className="appsheet__l" style={{ "--i": links.length + 1 } as React.CSSProperties}><Icon name="home" size={22} />Ganor homepage</a>
          </nav>
          <div className="appsheet__foot">
            <div className="appsheet__theme"><small>Appearance</small><ThemeSwitch /></div>
            {signOut}
          </div>
        </div>,
        document.body,
      )}
      <NewEventChooser open={chooser} onClose={() => setChooser(false)} />
    </header>
  )
}
