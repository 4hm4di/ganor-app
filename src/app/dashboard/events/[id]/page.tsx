import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { EventToolsView } from "./EventToolsView"

export const metadata: Metadata = { title: "Event tools" }

const nowMs = () => Date.now()

export default async function EventTools({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string; published?: string; error?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const { supabase, userId } = await getUserId()
  if (!userId) redirect("/login")

  const { data: ev } = await supabase
    .from("events")
    .select("*, ticket_types(*)")
    .eq("id", id)
    .eq("host_id", userId)
    .order("sort_order", { referencedTable: "ticket_types", ascending: true })
    .single()
  if (!ev) notFound()

  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "ganor-app.vercel.app"
  const publicUrl = `${host.startsWith("localhost") ? "http" : "https"}://${host}/e/${ev.slug}`
  const { data: rows } = await supabase
    .from("tickets")
    .select("checked_in_at, created_at, ticket_types(name), orders!inner(buyer_name, status, paid_at)")
    .eq("event_id", id)
    .eq("orders.status", "paid")
    .order("checked_in_at", { ascending: false, nullsFirst: false })
  const guests = (rows ?? []).map((r) => ({
    name: (r.orders as unknown as { buyer_name: string }).buyer_name,
    ticket: (r.ticket_types as unknown as { name: string } | null)?.name ?? "Ticket",
    in: Boolean(r.checked_in_at),
  }))
  // Daily sales and gate scans, in Lagos days. The window ends today, or on the event day once it has passed.
  const lagosDay = (iso: string) => new Date(new Date(iso).getTime() + 3_600_000).toISOString().slice(0, 10)
  const sales = new Map<string, number>()
  const scans = new Map<string, number>()
  for (const r of rows ?? []) {
    const o = r.orders as unknown as { paid_at: string | null }
    const d = lagosDay(o.paid_at ?? r.created_at)
    sales.set(d, (sales.get(d) ?? 0) + 1)
    if (r.checked_in_at) { const h = new Date(new Date(r.checked_in_at).getTime() + 3_600_000).getUTCHours(); scans.set(String(h), (scans.get(String(h)) ?? 0) + 1) }
  }
  const end = Math.min(nowMs(), new Date(ev.ends_at ?? ev.starts_at).getTime() + 86_400_000)
  const daily = Array.from({ length: 14 }, (_, i) => {
    const d = lagosDay(new Date(end - (13 - i) * 86_400_000).toISOString())
    return { day: d, count: sales.get(d) ?? 0 }
  })
  const hours = [...scans.keys()].map(Number)
  const scanHours = hours.length
    ? Array.from({ length: Math.max(...hours) - Math.min(...hours) + 1 }, (_, i) => { const h = Math.min(...hours) + i; return { hour: h, count: scans.get(String(h)) ?? 0 } })
    : []
  return <EventToolsView ev={ev} userId={userId} publicUrl={publicUrl} sp={sp} guests={guests} daily={daily} scanHours={scanHours} />
}
