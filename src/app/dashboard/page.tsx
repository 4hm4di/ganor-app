import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { OverviewView, RANGES, type Stats } from "./OverviewView"

export const metadata: Metadata = { title: "Overview" }

// Host overview: only this host's events. Headline numbers with comparisons, sales over time,
// what's next, and what needs attention (dashboard-designer: decisions first, F-pattern).
export default async function HostOverview({ searchParams }: { searchParams: Promise<{ range?: string; password?: string }> }) {
  const sp = await searchParams
  const range = (RANGES as readonly number[]).includes(Number(sp.range)) ? Number(sp.range) : 7
  const { supabase, userId } = await getUserId()
  if (!userId) redirect("/login")

  const [{ data: profile }, { data: statsRaw }, { data: events }, { data: suspension }] = await Promise.all([
    supabase.from("profiles").select("display_name, logo_url").eq("id", userId).single(),
    supabase.rpc("host_stats", { p_days: range }),
    supabase
      .from("events")
      .select("id, title, slug, city, venue_name, starts_at, ends_at, status, cover_url, ticket_types(quantity, sold, on_sale, price_kobo)")
      .eq("host_id", userId)
      .order("starts_at", { ascending: true }),
    supabase.rpc("my_suspension"),
  ])
  return <OverviewView range={range} first={profile?.display_name?.split(/\s+/)[0]} stats={statsRaw as Stats | null} events={events ?? []} suspended={suspension as { reason: string } | null} passwordUpdated={sp.password === "updated"} />
}
