"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Icon } from "./Icon"

// Header for signed-out visitors. The hidden staff sign-in (/hq/login) gets a bare HQ bar instead.
export function PublicNav() {
  const path = usePathname()
  if (path.startsWith("/hq")) {
    return (
      <header className="topbar topbar--hq">
        <div className="wrap topbar__in">
          <span className="hqbrand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/ganor-lockup-white.svg" alt="Ganor" width={104} height={20} />
            <span>HQ</span>
          </span>
        </div>
      </header>
    )
  }
  return (
    <header className="topbar">
      <div className="wrap topbar__in">
        <Link href="/" className="topbar__logo" aria-label="Ganor home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-light" src="/brand/ganor-lockup-indigo.svg" alt="Ganor" width={118} height={22} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-dark" src="/brand/ganor-lockup-white.svg" alt="Ganor" width={118} height={22} />
        </Link>
        <nav className="topbar__nav" aria-label="Main">
          <Link href="/events" className="topbar__link">Find events</Link>
          {!path.startsWith("/login") && <Link href="/login" className="btn btn--primary btn--sm nav-cta">
            <span>Host sign in</span>
            <span className="btn__arrow" aria-hidden="true"><Icon name="arrow" /></span>
          </Link>}
        </nav>
      </div>
    </header>
  )
}
