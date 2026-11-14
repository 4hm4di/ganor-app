"use client"

import { usePathname } from "next/navigation"
import { PublicNav } from "./PublicNav"

// Each kind of account has its own area. A host or HQ session in this browser must never show
// its name or menu on another account's pages: the gate area (gate accounts sign in separately),
// the sign-in pages, and HQ pages for someone who isn't HQ staff.
const NEUTRAL = ["/gate", "/hq/login", "/forgot-password", "/reset-password", "/auth/"]

export function HeaderScope({ staff, children }: { staff: boolean; children: React.ReactNode }) {
  const path = usePathname()
  const neutral = NEUTRAL.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : `${p}/`)) || (path.startsWith("/hq") && !staff)
  return neutral ? <PublicNav /> : <>{children}</>
}
