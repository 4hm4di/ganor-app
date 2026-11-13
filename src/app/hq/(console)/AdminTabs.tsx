"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { RATINGS_ENABLED } from "@/lib/ganor"
import type { HqMe } from "@/lib/hq-roles"

export function AdminTabs({ can }: { can: HqMe["can"] }) {
  const path = usePathname()
  const tabs = [
    { href: "/hq", label: "Overview" },
    { href: "/hq/watch", label: "Watchlist" },
    { href: "/hq/hosts", label: "Hosts" },
    { href: "/hq/events", label: "Events" },
    ...(can.finance ? [{ href: "/hq/payouts", label: "Payouts" }] : []),
    ...(RATINGS_ENABLED ? [{ href: "/hq/ratings", label: "Ratings" }] : []),
    { href: "/hq/staff", label: can.team ? "Team & roles" : "Team" },
  ]
  return (
    <nav className="tabs tabs--scroll" aria-label="HQ sections">
      {tabs.map((t) => {
        const on = t.href === "/hq" ? path === "/hq" : path.startsWith(t.href)
        return <Link key={t.href} href={t.href} className={`tabs__t${on ? " is-on" : ""}`} aria-current={on ? "page" : undefined}>{t.label}</Link>
      })}
    </nav>
  )
}
