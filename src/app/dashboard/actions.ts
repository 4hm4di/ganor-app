"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { CATEGORIES, lagosLocalToIso, slugify } from "@/lib/ganor"

export type FormState = { status: "idle" | "ok" | "error"; message?: string; fields?: Record<string, string> }

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim()

async function requireHost() {
  const { supabase, userId } = await getUserId()
  if (!userId) redirect("/login")
  return { supabase, userId }
}

function readEvent(fd: FormData) {
  const fields = {
    title: str(fd, "title"),
    category: str(fd, "category"),
    city: str(fd, "city"),
    venue_name: str(fd, "venue_name"),
    venue_address: str(fd, "venue_address"),
    starts_at: str(fd, "starts_at"),
    ends_at: str(fd, "ends_at"),
    description: str(fd, "description"),
    halal_friendly: fd.get("halal_friendly") ? "on" : "",
  }
  const errors: string[] = []
  if (fields.title.length < 3 || fields.title.length > 120) errors.push("Give the event a name (3 to 120 characters).")
  if (!(CATEGORIES as readonly string[]).includes(fields.category)) errors.push("Choose an event type.")
  if (fields.city.length < 2 || fields.city.length > 60) errors.push("Choose or type the city.")
  if (fields.venue_name.length < 2) errors.push("Add the venue name.")
  const starts = lagosLocalToIso(fields.starts_at)
  const ends = fields.ends_at ? lagosLocalToIso(fields.ends_at) : null
  if (!starts) errors.push("Add the start date and time.")
  if (fields.ends_at && !ends) errors.push("Check the end date and time.")
  if (starts && ends && new Date(ends) <= new Date(starts)) errors.push("The event must end after it starts.")
  if (fields.description.length > 5000) errors.push("Keep the description under 5,000 characters.")
  return {
    fields,
    errors,
    row: {
      title: fields.title,
      category: fields.category,
      city: fields.city,
      venue_name: fields.venue_name,
      venue_address: fields.venue_address,
      starts_at: starts ?? "",
      ends_at: ends,
      description: fields.description,
      halal_friendly: fields.halal_friendly === "on",
    },
  }
}

export async function createEvent(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase, userId } = await requireHost()
  const { fields, errors, row } = readEvent(fd)
  if (errors.length) return { status: "error", message: errors.join(" "), fields }

  const base = slugify(row.title) || "event"
  let id: string | null = null
  for (let attempt = 0; attempt < 4 && !id; attempt++) {
    const suffix = Math.random().toString(36).slice(2, 6)
    const { data, error } = await supabase
      .from("events")
      .insert({ ...row, host_id: userId, slug: `${base}-${suffix}` })
      .select("id")
      .single()
    if (data) id = data.id
    else if (error && error.code !== "23505") return { status: "error", message: "We couldn't save the event. Try again.", fields }
  }
  if (!id) return { status: "error", message: "We couldn't save the event. Try again.", fields }

  revalidatePath("/dashboard")
  redirect(`/dashboard/events/${id}?created=1`)
}

export async function updateEvent(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireHost()
  const id = str(fd, "id")
  const { fields, errors, row } = readEvent(fd)
  if (errors.length) return { status: "error", message: errors.join(" "), fields }
  const { data, error } = await supabase.from("events").update(row).eq("id", id).select("slug").single()
  if (error || !data) return { status: "error", message: "We couldn't save your changes. Try again.", fields }
  revalidatePath(`/dashboard/events/${id}`)
  revalidatePath(`/e/${data.slug}`)
  return { status: "ok", message: "Saved." }
}

export async function setEventStatus(fd: FormData) {
  const { supabase } = await requireHost()
  const id = str(fd, "id")
  const to = str(fd, "to")
  if (!["draft", "published", "cancelled"].includes(to)) return

  if (to === "published") {
    const { data: ev } = await supabase.from("events").select("starts_at, ticket_types(id)").eq("id", id).single()
    if (!ev) redirect(`/dashboard/events/${id}?error=notfound`)
    if (!ev.ticket_types?.length) redirect(`/dashboard/events/${id}?error=tickets`)
    if (new Date(ev.starts_at) < new Date()) redirect(`/dashboard/events/${id}?error=past`)
  }

  const { data } = await supabase.from("events").update({ status: to }).eq("id", id).select("slug").single()
  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/events/${id}`)
  if (data) revalidatePath(`/e/${data.slug}`)
  redirect(`/dashboard/events/${id}${to === "published" ? "?published=1" : ""}`)
}

export async function deleteDraft(fd: FormData) {
  const { supabase } = await requireHost()
  const id = str(fd, "id")
  await supabase.from("events").delete().eq("id", id).eq("status", "draft")
  revalidatePath("/dashboard")
  redirect("/dashboard")
}

export async function addTicketType(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireHost()
  const event_id = str(fd, "event_id")
  const fields = {
    name: str(fd, "name"),
    price: str(fd, "price").replace(/[,\s₦]/g, ""),
    quantity: str(fd, "quantity").replace(/[,\s]/g, ""),
    max_per_order: str(fd, "max_per_order") || "10",
    description: str(fd, "description"),
  }
  const errors: string[] = []
  const price = fields.price === "" ? 0 : Number(fields.price)
  const quantity = Number(fields.quantity)
  const maxPer = Number(fields.max_per_order)
  if (!fields.name || fields.name.length > 60) errors.push("Name the ticket, for example Regular or VIP.")
  if (!Number.isFinite(price) || price < 0 || price > 10_000_000) errors.push("Enter a price in naira, or 0 for free.")
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) errors.push("Enter how many tickets (1 to 100,000).")
  if (!Number.isInteger(maxPer) || maxPer < 1 || maxPer > 50) errors.push("Tickets per order must be 1 to 50.")
  if (errors.length) return { status: "error", message: errors.join(" "), fields }

  const { count } = await supabase.from("ticket_types").select("id", { count: "exact", head: true }).eq("event_id", event_id)
  const { error } = await supabase.from("ticket_types").insert({
    event_id,
    name: fields.name,
    description: fields.description,
    price_kobo: Math.round(price * 100),
    quantity,
    max_per_order: maxPer,
    sort_order: count ?? 0,
  })
  if (error) return { status: "error", message: "We couldn't add the ticket. Try again.", fields }
  revalidatePath(`/dashboard/events/${event_id}`)
  return { status: "ok", message: `${fields.name} added.` }
}

export async function deleteTicketType(fd: FormData) {
  const { supabase } = await requireHost()
  const id = str(fd, "id")
  const event_id = str(fd, "event_id")
  await supabase.from("ticket_types").delete().eq("id", id).eq("sold", 0)
  revalidatePath(`/dashboard/events/${event_id}`)
}

export async function updateProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase, userId } = await requireHost()
  const display_name = str(fd, "display_name")
  const phone = str(fd, "phone")
  if (display_name.length < 2 || display_name.length > 80) return { status: "error", message: "Enter the name guests will see (2 to 80 characters).", fields: { display_name, phone } }
  if (phone && !/^(\+?234|0)[789][01]\d{8}$/.test(phone.replace(/[\s-]/g, ""))) return { status: "error", message: "Enter a Nigerian phone number, like 0810 330 1999.", fields: { display_name, phone } }
  const { error: e1 } = await supabase.from("profiles").update({ display_name }).eq("id", userId)
  const { error: e2 } = await supabase.from("host_contacts").upsert({ host_id: userId, phone: phone || null })
  if (e1 || e2) return { status: "error", message: "We couldn't save your profile. Try again.", fields: { display_name, phone } }
  revalidatePath("/dashboard", "layout")
  return { status: "ok", message: "Profile saved." }
}
