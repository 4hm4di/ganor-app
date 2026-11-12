"use server"

import { revalidatePath } from "next/cache"
import { getUserId } from "@/lib/supabase/server"
import { siteOrigin } from "@/lib/auth"
import { ratingMessage } from "@/lib/consent"
import { formatDate } from "@/lib/ganor"

export type SendLink = { inviteId: string; name: string; phone: string; attended: boolean; link: string; whatsapp: string }
export type SendState = { status: "idle" | "ok" | "error"; message?: string; links?: SendLink[] }

async function staff() {
  const { supabase, userId } = await getUserId()
  if (!userId) return null
  const { data } = await supabase.rpc("is_staff")
  return data ? supabase : null
}

function waLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/^\+/, "")}?text=${encodeURIComponent(text)}`
}

type Row = { invite_id: string; order_id: string; buyer_name: string; buyer_phone: string; token: string; expires_at: string; attended?: boolean }

async function buildLinks(rows: Row[], ev: { title: string; starts_at: string }) {
  const origin = await siteOrigin()
  return rows.map((r) => {
    const link = `${origin}/r/${r.token}`
    const text = ratingMessage({
      firstName: r.buyer_name.split(/\s+/)[0] ?? "there",
      event: ev.title,
      date: formatDate(ev.starts_at),
      order: r.order_id.slice(0, 8).toUpperCase(),
      until: formatDate(r.expires_at),
      link,
    })
    return { inviteId: r.invite_id, name: r.buyer_name, phone: r.buyer_phone, attended: r.attended ?? false, link, whatsapp: waLink(r.buyer_phone, text) }
  })
}

export async function createRatingLinks(_prev: SendState, fd: FormData): Promise<SendState> {
  const supabase = await staff()
  if (!supabase) return { status: "error", message: "Only Ganor staff can do this." }
  const eventId = String(fd.get("event_id") ?? "")
  const { data: ev } = await supabase.from("events").select("title, starts_at").eq("id", eventId).single()
  if (!ev) return { status: "error", message: "Event not found." }
  const { data, error } = await supabase.rpc("admin_create_rating_invites", { p_event: eventId })
  if (error) return { status: "error", message: error.message }
  const links = await buildLinks(data ?? [], ev)
  revalidatePath("/admin/ratings")
  return links.length
    ? { status: "ok", links }
    : { status: "ok", links: [], message: "No new buyers to invite. Everyone eligible already has a link, or no paid orders agreed to rating messages." }
}

export async function reissueRatingLink(_prev: SendState, fd: FormData): Promise<SendState> {
  const supabase = await staff()
  if (!supabase) return { status: "error", message: "Only Ganor staff can do this." }
  const inviteId = String(fd.get("invite_id") ?? "")
  const { data: inv } = await supabase.from("review_invites").select("order_id, attended, events(title, starts_at)").eq("id", inviteId).single()
  const { data, error } = await supabase.rpc("admin_reissue_rating_invite", { p_invite: inviteId })
  if (error || !inv || !data?.length) return { status: "error", message: error?.message ?? "Couldn't make a new link." }
  const ev = inv.events as unknown as { title: string; starts_at: string }
  const links = await buildLinks(data.map((r) => ({ ...r, order_id: inv.order_id, attended: inv.attended })), ev)
  return { status: "ok", links }
}

export async function suppressPhone(_prev: SendState, fd: FormData): Promise<SendState> {
  const supabase = await staff()
  if (!supabase) return { status: "error", message: "Only Ganor staff can do this." }
  const phone = String(fd.get("phone") ?? "")
  const scope = fd.get("scope") === "all" ? "all" : "rating_request"
  const { data, error } = await supabase.rpc("admin_suppress_phone", { p_phone: phone, p_scope: scope })
  if (error) return { status: "error", message: error.message }
  revalidatePath("/admin/ratings")
  return { status: "ok", message: `Done. This number won't get ${scope === "all" ? "any more messages" : "rating requests"}${data ? `; ${data} open link${data === 1 ? "" : "s"} switched off` : ""}.` }
}

export async function moderateReview(fd: FormData) {
  const supabase = await staff()
  if (!supabase) return
  const reviewId = String(fd.get("review_id") ?? "")
  const status = fd.get("status") === "hidden" ? "hidden" : "published"
  await supabase.rpc("admin_set_review_status", { p_review: reviewId, p_status: status, p_note: status === "hidden" ? "hidden after report" : "kept after report" })
  revalidatePath("/admin/ratings")
}
