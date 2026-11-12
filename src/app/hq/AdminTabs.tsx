"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { RATINGS_ENABLED } from "@/lib/ganor"

const TABS = [
  { href: "/hq", label: "Overview" },
  { href: "/hq/hosts", label: "Hosts" },
  { href: "/hq/events", label: "Events" },
  ...(RATINGS_ENABLED ? [{ href: "/hq/ratings", label: "Ratings" }] : []),
  { href: "/hq/staff", label: "Staff & log" },
]

export function AdminTabs() {
  const path = usePathname()
  return (
    <nav className="tabs" aria-label="Admin sections">
      {TABS.map((t) => {
        const on = t.href === "/hq" ? path === "/hq" : path.startsWith(t.href)
        return <Link key={t.href} href={t.href} className={`tabs__t${on ? " is-on" : ""}`} aria-current={on ? "page" : undefined}>{t.label}</Link>
      })}
    </nav>
  )
}
