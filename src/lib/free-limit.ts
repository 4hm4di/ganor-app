// Free RSVP events: one at a time, at most 2 started per calendar month (enforced in the database).
export type FreeAllowance = { limit: number; used: number; active: { id: string; title: string } | null; resets_on: string; can_create: boolean }

export const isFreeLimitError = (message?: string | null) => /^FREE_LIMIT_/.test(message ?? "")
export const freeLimitText = (message: string) => message.replace(/^FREE_LIMIT_(ACTIVE|MONTH):\s*/, "")
export const resetsLabel = (a: FreeAllowance) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${a.resets_on}T00:00:00Z`))
export const freeLeftLabel = (a: FreeAllowance) => {
  const left = Math.max(0, a.limit - a.used)
  return `${left} of ${a.limit} free event${a.limit === 1 ? "" : "s"} left this month`
}
