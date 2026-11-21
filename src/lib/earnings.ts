import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { feeKobo, TZ } from "@/lib/ganor"

type Db = SupabaseClient<Database>
type RawOrder = {
  id: string; status: string; total_kobo: number; created_at: string; paid_at: string | null; buyer_name: string
  events: { id: string; title: string; fee_mode: string; starts_at: string } | null
  tickets: { price_kobo: number }[]
}
export type Sale = { id: string; at: string; buyer: string; event: string; eventId: string; startsAt: string; count: number; paid: number; fee: number; share: number; refunded: boolean }

const monthKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).format(new Date(iso))

// A host's paid sales and what they earned: share after the Ganor fee (when the host absorbs it), fees, refunds.
// Free tickets and free RSVPs never count towards earnings.
export async function hostEarnings(supabase: Db, userId: string) {
  const { data } = await supabase
    .from("orders")
    .select("id, status, total_kobo, created_at, paid_at, buyer_name, events!inner(id, title, host_id, fee_mode, starts_at), tickets(price_kobo)")
    .eq("events.host_id", userId)
    .in("status", ["paid", "refunded"])
    .order("created_at", { ascending: false })
    .limit(3000)
  const sales: Sale[] = ((data ?? []) as unknown as RawOrder[]).flatMap((o) => {
    const paid = o.tickets.filter((t) => t.price_kobo > 0)
    if (!paid.length || !o.events) return []
    const absorb = o.events.fee_mode === "absorb"
    return [{
      id: o.id, at: o.paid_at ?? o.created_at, buyer: o.buyer_name, event: o.events.title, eventId: o.events.id, startsAt: o.events.starts_at,
      count: paid.length, paid: o.total_kobo,
      fee: paid.reduce((s, t) => s + feeKobo(t.price_kobo), 0),
      share: paid.reduce((s, t) => s + (absorb ? Math.max(0, t.price_kobo - feeKobo(t.price_kobo)) : t.price_kobo), 0),
      refunded: o.status === "refunded",
    }]
  })
  const kept = sales.filter((s) => !s.refunded)
  const thisMonth = monthKey(new Date().toISOString())
  return {
    sales,
    takeHome: kept.reduce((n, s) => n + s.share, 0),
    month: kept.filter((s) => monthKey(s.at) === thisMonth).reduce((n, s) => n + s.share, 0),
    fees: kept.reduce((n, s) => n + s.fee, 0),
    refunded: sales.filter((s) => s.refunded).reduce((n, s) => n + s.share, 0),
    tickets: kept.reduce((n, s) => n + s.count, 0),
  }
}
export type Earnings = Awaited<ReturnType<typeof hostEarnings>>
