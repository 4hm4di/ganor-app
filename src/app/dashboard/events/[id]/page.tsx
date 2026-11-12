import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { EventToolsView } from "./EventToolsView"

export const metadata: Metadata = { title: "Event tools" }

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
  return <EventToolsView ev={ev} userId={userId} publicUrl={publicUrl} sp={sp} />
}
