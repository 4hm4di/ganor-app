// Content decisions shared with the live site (ganor.ng). Keep these in step with website/SITE.md.

export const CATEGORIES = [
  "Trade fairs",
  "Conferences",
  "Summits",
  "Lectures",
  "Campus events",
  "Associations",
  "Cooperative launches",
  "Shows",
  "Workshops",
] as const

export const CATEGORY_ICON: Record<string, string> = {
  "Trade fairs": "market",
  Conferences: "group",
  Summits: "group",
  Lectures: "mic",
  "Campus events": "cap",
  Associations: "users",
  "Cooperative launches": "coop",
  Shows: "music",
  Workshops: "pen",
}

export const CITIES = [
  "Abuja", "Bauchi", "Ibadan", "Ilorin", "Jos", "Kaduna", "Kano",
  "Katsina", "Lagos", "Maiduguri", "Port Harcourt", "Sokoto", "Zaria",
] as const

// Fee shown on the site: 5% + ₦100 per paid ticket. Free tickets cost nothing.
export const FEE_RATE = 0.05
export const FEE_FLAT_KOBO = 100_00

export function feeKobo(priceKobo: number) {
  if (priceKobo <= 0) return 0
  return Math.round(priceKobo * FEE_RATE) + FEE_FLAT_KOBO
}

export const TZ = "Africa/Lagos" // UTC+1 all year, no daylight saving

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })
export function formatNaira(kobo: number) {
  if (kobo <= 0) return "Free"
  return naira.format(kobo / 100)
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts }).format(new Date(iso))
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso)).replace(" ", " ")
}

// <input type="datetime-local"> value (Lagos wall time) -> ISO with offset, and back.
export function lagosLocalToIso(local: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null
  const d = new Date(`${local}:00+01:00`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}
export function isoToLagosLocal(iso: string | null) {
  if (!iso) return ""
  const d = new Date(new Date(iso).getTime() + 60 * 60 * 1000)
  return d.toISOString().slice(0, 16)
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "")
}

// Where an event is in its life, from its stored status and its dates.
// Stored status is only draft | published | cancelled; "live", "ended" and "sold out" are derived.
export type EventPhase = "draft" | "upcoming" | "soldout" | "live" | "ended" | "cancelled"

export const PHASE_LABEL: Record<EventPhase, string> = {
  draft: "Draft",
  upcoming: "On sale",
  soldout: "Sold out",
  live: "Happening now",
  ended: "Ended",
  cancelled: "Cancelled",
}

// Events without an end time are treated as running for 6 hours.
export function eventEndsAt(ev: { starts_at: string; ends_at: string | null }) {
  return ev.ends_at ? new Date(ev.ends_at).getTime() : new Date(ev.starts_at).getTime() + 6 * 3_600_000
}

export function eventPhase(
  ev: { status: string; starts_at: string; ends_at: string | null },
  tickets?: { quantity: number; sold: number; on_sale?: boolean }[],
  now: number = Date.now(),
): EventPhase {
  if (ev.status === "cancelled") return "cancelled"
  const start = new Date(ev.starts_at).getTime()
  const end = eventEndsAt(ev)
  if (now >= end) return "ended"
  if (ev.status !== "published") return "draft"
  if (now >= start) return "live"
  const selling = (tickets ?? []).filter((t) => t.on_sale !== false)
  if (selling.length > 0 && selling.every((t) => t.sold >= t.quantity)) return "soldout"
  return "upcoming"
}

export const RATINGS_ENABLED = false // Guest ratings are built but set aside for now.
