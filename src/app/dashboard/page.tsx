import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { OverviewView, RANGES, type Stats } from "./OverviewView"
import { setupSteps } from "./SetupChecklist"

export const metadata: Metadata = { title: "Overview" }

// Host overview: only this host's events. Headline numbers with comparisons, sales over time,
// what's next, and what needs attention (dashboard-designer: decisions first, F-pattern).
export default async function HostOverview({ searchParams }: { searchParams: Promise<{ range?: string; password?: string; welcome?: string }> }) {
  const sp = await searchParams
  const range = (RANGES as readonly number[]).includes(Number(sp.range)) ? Number(sp.range) : 7
  const { supabase, userId } = await getUserId()
  if (!userId) redirect("/login")

  const [{ data: profile }, { data: statsRaw }, { data: events }, { data: suspension }, { data: payout }, { count: team }] = await Promise.all([
    supabase.from("profiles").select("display_name, logo_url, bio, contact_whatsapp, contact_phone, setup_hidden_at").eq("id", userId).single(),
    supabase.rpc("host_stats", { p_days: range }),
    supabase
      .from("events")
      .select("id, title, slug, city, venue_name, starts_at, ends_at, status, cover_url, ticket_types(quantity, sold, on_sale, price_kobo)")
      .eq("host_id", userId)
      .order("starts_at", { ascending: true }),
    supabase.rpc("my_suspension"),
    supabase.from("payout_accounts").select("status").eq("host_id", userId).maybeSingle(),
    supabase.from("host_staff").select("id", { count: "exact", head: true }).eq("host_id", userId),
  ])
  // The new-host to-do list, worked out from what the host has already done.
  const evs = events ?? []
  const sold = (e: (typeof evs)[number]) => e.ticket_types.reduce((n, t) => n + t.sold, 0)
  const steps = setupSteps({
    logo: !!profile?.logo_url,
    bio: (profile?.bio ?? "").trim().length > 0,
    contact: !!profile?.contact_whatsapp || !!profile?.contact_phone,
    payout: !!payout,
    team: (team ?? 0) > 0,
    events: evs.length,
    published: evs.filter((e) => e.status === "published").length,
    guests: evs.reduce((n, e) => n + sold(e), 0),
    firstDraft: evs.find((e) => e.status === "draft")?.id ?? null,
    firstLive: evs.find((e) => e.status === "published" && new Date(e.ends_at ?? e.starts_at) > new Date())?.id ?? evs.find((e) => e.status === "published")?.id ?? null,
  })
  const setup = { steps, hidden: !!profile?.setup_hidden_at, welcome: sp.welcome === "1" }
  return <OverviewView range={range} first={profile?.display_name?.split(/\s+/)[0]} stats={statsRaw as Stats | null} events={events ?? []} suspended={suspension as { reason: string } | null} passwordUpdated={sp.password === "updated"} setup={setup} />
}
