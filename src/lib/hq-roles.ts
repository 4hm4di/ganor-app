// HQ roles and login helpers, safe to import in client components.
export type HqRole = "owner" | "operations" | "finance" | "support" | "viewer"
export type HqMe = {
  role: HqRole
  username: string | null
  display_name: string | null
  can: { moderate: boolean; audit: boolean; contacts: boolean; finance: boolean; team: boolean }
}

// What each HQ role can do. The database enforces the same rules (private.hq_can).
export const HQ_ROLES: { value: HqRole; label: string; does: string; icon: string }[] = [
  { value: "owner", label: "Owner", icon: "verified", does: "GANOR only. Everything, including adding HQ members, changing roles and setting passwords. There is one owner." },
  { value: "operations", label: "Operations", icon: "settings", does: "Suspends and restores hosts, publishes or cancels events, moderates reviews, reads the HQ log." },
  { value: "finance", label: "Finance", icon: "wallet", does: "Sees payout accounts and sales, marks payout details checked or rejected." },
  { value: "support", label: "Support", icon: "support", does: "Looks up hosts and events with contact details to help people. Can't change anything." },
  { value: "viewer", label: "Viewer", icon: "search", does: "Read-only numbers and lists, without contact details." },
]
export const roleLabel = (r: string) => HQ_ROLES.find((x) => x.value === r)?.label ?? r

// HQ staff sign in with a username; behind it is a private address that never receives email.
export const HQ_LOGIN_DOMAIN = "staff.ganor.ng"
export const hqLoginEmail = (id: string) => (id.includes("@") ? id.trim().toLowerCase() : `${id.trim().toLowerCase()}@${HQ_LOGIN_DOMAIN}`)


export const roleIcon = (r: string) => HQ_ROLES.find((x) => x.value === r)?.icon ?? "user"
// Roles an owner can hand out: everything except owner (Ganor HQ has exactly one).
export const ASSIGNABLE_ROLES = HQ_ROLES.filter((r) => r.value !== "owner")
