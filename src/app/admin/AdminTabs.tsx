"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { RATINGS_ENABLED } from "@/lib/ganor"

const TABS = [
  { href: "/admin", label: "Admin overview" },
  { href: "/admin/hosts", label: "Hosts" },
  { href: "/admin/events", label: "Events" },
  ...(RATINGS_ENABLED ? [{ href: "/admin/ratings", label: "Ratings" }] : []),
  { href: "/admin/staff", label: "Staff & log" },
]

export function AdminTabs() {
  const path = usePathname()
  return (
    <nav className="tabs" aria-label="Admin sections">
      {TABS.map((t) => {
        const on = t.href === "/admin" ? path === "/admin" : path.startsWith(t.href)
        return <Link key={t.href} href={t.href} className={`tabs__t${on ? " is-on" : ""}`} aria-current={on ? "page" : undefined}>{t.label}</Link>
      })}
    </nav>
  )
}
