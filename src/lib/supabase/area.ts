// Ganor keeps two separate sign-ins in one browser: the host app and HQ. Each has its own
// cookie, so signing in to one never replaces or signs out the other.
//   host: Supabase's default cookie (sb-<ref>-auth-token)
//   hq:   HQ_COOKIE, used for every /hq page and HQ sign-out / keep-alive
// The proxy works out the area for each request and passes it on in AREA_HEADER.
export type Area = "host" | "hq"
export const HQ_COOKIE = "sb-ganor-hq-auth"
export const AREA_HEADER = "x-ganor-area"

export function areaFor(path: string, search: URLSearchParams): Area {
  if (path === "/hq" || path.startsWith("/hq/")) return "hq"
  if (path.startsWith("/auth/") && search.get("to") === "hq") return "hq"
  return "host"
}

export const cookieOptionsFor = (area: Area) => (area === "hq" ? { name: HQ_COOKIE } : undefined)
export const activeCookieFor = (base: string, area: Area) => (area === "hq" ? `${base}_hq` : base)
