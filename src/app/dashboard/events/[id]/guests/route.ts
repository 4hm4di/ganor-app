import { getUserId } from "@/lib/supabase/server"
import { buildGuestPdf, guestCsv, type Guest } from "@/lib/guestPdf"
import { formatDate, formatTime, slugify } from "@/lib/ganor"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET ?format=pdf (default) or ?format=csv. Hosts download their own event's guest list;
// Ganor staff can download any. Row Level Security decides what the queries return.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, userId } = await getUserId()
  if (!userId) return new Response("Sign in first", { status: 401 })

  const { data: ev } = await supabase
    .from("events")
    .select("id, title, slug, starts_at, venue_name, city, host_id, profiles(display_name)")
    .eq("id", id)
    .maybeSingle()
  if (!ev) return new Response("Not found", { status: 404 })
  const staff = (await supabase.rpc("is_staff")).data === true
  if (ev.host_id !== userId && !staff) return new Response("Not found", { status: 404 })

  const { data: rows } = await supabase
    .from("tickets")
    .select("code, checked_in_at, created_at, order_id, ticket_types(name), orders!inner(buyer_name, status)")
    .eq("event_id", id)
    .eq("orders.status", "paid")
    .order("created_at")

  const guests: Guest[] = (rows ?? [])
    .map((r) => ({
      name: (r.orders as unknown as { buyer_name: string }).buyer_name,
      ticketType: (r.ticket_types as unknown as { name: string } | null)?.name ?? "Ticket",
      code: `GNR-${r.code.slice(0, 5)}-${r.code.slice(5)}`,
      checkedInAt: r.checked_in_at,
      order: r.order_id.slice(0, 8).toUpperCase(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const when = (iso: string) => `${formatDate(iso, { day: "numeric", month: "short" })}, ${formatTime(iso)}`
  const file = `ganor-guest-list-${slugify(ev.title).slice(0, 40) || "event"}`
  const format = new URL(request.url).searchParams.get("format")

  if (format === "csv") {
    return new Response(guestCsv(guests, when), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${file}.csv"`,
        "Cache-Control": "no-store",
      },
    })
  }

  const pdf = await buildGuestPdf({
    event: { title: ev.title, date: formatDate(ev.starts_at), time: formatTime(ev.starts_at), venue: ev.venue_name, city: ev.city },
    host: (ev.profiles as unknown as { display_name: string } | null)?.display_name ?? "",
    guests,
    generatedAt: when(new Date().toISOString()),
    formatTime: when,
  })
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
