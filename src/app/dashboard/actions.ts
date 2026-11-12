"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { CATEGORIES, lagosLocalToIso, slugify } from "@/lib/ganor"
import { isOwnImage, objectPath, type Bucket } from "@/lib/storage"

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

  revalidatePath("/dashboard", "layout")
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
  revalidatePath("/dashboard", "layout")
  revalidatePath(`/dashboard/events/${id}`)
  if (data) revalidatePath(`/e/${data.slug}`)
  redirect(`/dashboard/events/${id}${to === "published" ? "?published=1" : ""}`)
}

export async function deleteDraft(fd: FormData) {
  const { supabase } = await requireHost()
  const id = str(fd, "id")
  await supabase.from("events").delete().eq("id", id).eq("status", "draft")
  revalidatePath("/dashboard", "layout")
  redirect("/dashboard/events")
}

export async function addTicketType(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireHost()
  const event_id = str(fd, "event_id")
  const { fields, errors, price_kobo, quantity, maxPer } = readTicket(fd)
  if (errors.length) return { status: "error", message: errors.join(" "), fields }

  const { count } = await supabase.from("ticket_types").select("id", { count: "exact", head: true }).eq("event_id", event_id)
  const { error } = await supabase.from("ticket_types").insert({
    event_id,
    name: fields.name,
    description: fields.description,
    price_kobo,
    quantity,
    max_per_order: maxPer,
    sort_order: count ?? 0,
  })
  if (error) return { status: "error", message: "We couldn't add the ticket. Try again.", fields }
  await revalidateEvent(supabase, event_id)
  return { status: "ok", message: `${fields.name} added.` }
}

function readTicket(fd: FormData) {
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
  return { fields, errors, price_kobo: Math.round(price * 100), quantity, maxPer }
}

export async function updateTicketType(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireHost()
  const id = str(fd, "id")
  const event_id = str(fd, "event_id")
  const { fields, errors, price_kobo, quantity, maxPer } = readTicket(fd)
  if (errors.length) return { status: "error", message: errors.join(" "), fields }

  const { data: current } = await supabase.from("ticket_types").select("sold, price_kobo").eq("id", id).single()
  if (!current) return { status: "error", message: "We couldn't find that ticket.", fields }
  if (quantity < current.sold) return { status: "error", message: `You've already sold ${current.sold}. The total can't go below that.`, fields }
  if (current.sold > 0 && price_kobo !== current.price_kobo) return { status: "error", message: "The price is locked once tickets have sold. Add a new ticket type instead.", fields }

  const { error } = await supabase
    .from("ticket_types")
    .update({ name: fields.name, description: fields.description, price_kobo, quantity, max_per_order: maxPer })
    .eq("id", id)
  if (error) return { status: "error", message: "We couldn't save the ticket. Try again.", fields }
  await revalidateEvent(supabase, event_id)
  return { status: "ok", message: `${fields.name} saved.` }
}

async function revalidateEvent(supabase: Awaited<ReturnType<typeof requireHost>>["supabase"], eventId: string) {
  revalidatePath("/dashboard", "layout")
  revalidatePath(`/dashboard/events/${eventId}`)
  const { data } = await supabase.from("events").select("slug").eq("id", eventId).single()
  if (data) revalidatePath(`/e/${data.slug}`)
}

export async function setFeeMode(fd: FormData) {
  const { supabase } = await requireHost()
  const id = str(fd, "id")
  const mode = str(fd, "fee_mode")
  if (mode !== "buyer" && mode !== "absorb") return
  await supabase.from("events").update({ fee_mode: mode }).eq("id", id)
  await revalidateEvent(supabase, id)
}

async function replaceImage(bucket: Bucket, url: string, oldUrl: string | null, userId: string, supabase: Awaited<ReturnType<typeof requireHost>>["supabase"]) {
  if (url && !isOwnImage(url, bucket, userId)) return false
  const oldPath = objectPath(oldUrl, bucket)
  if (oldPath && oldUrl !== url) await supabase.storage.from(bucket).remove([oldPath])
  return true
}

export async function saveEventBanner(eventId: string, url: string): Promise<{ ok: boolean; message?: string }> {
  const { supabase, userId } = await requireHost()
  const { data: ev } = await supabase.from("events").select("cover_url").eq("id", eventId).eq("host_id", userId).single()
  if (!ev) return { ok: false, message: "We couldn't find that event." }
  if (!(await replaceImage("event-banners", url, ev.cover_url, userId, supabase))) return { ok: false, message: "That image couldn't be used." }
  const { error } = await supabase.from("events").update({ cover_url: url || null }).eq("id", eventId)
  if (error) return { ok: false, message: "We couldn't save the banner. Try again." }
  await revalidateEvent(supabase, eventId)
  return { ok: true }
}

export async function saveHostLogo(url: string): Promise<{ ok: boolean; message?: string }> {
  const { supabase, userId } = await requireHost()
  const { data: p } = await supabase.from("profiles").select("logo_url").eq("id", userId).single()
  if (!(await replaceImage("host-logos", url, p?.logo_url ?? null, userId, supabase))) return { ok: false, message: "That image couldn't be used." }
  const { error } = await supabase.from("profiles").update({ logo_url: url || null }).eq("id", userId)
  if (error) return { ok: false, message: "We couldn't save the logo. Try again." }
  revalidatePath("/dashboard", "layout")
  revalidatePath("/e/[slug]", "page")
  return { ok: true }
}

export async function deleteTicketType(fd: FormData) {
  const { supabase } = await requireHost()
  const id = str(fd, "id")
  const event_id = str(fd, "event_id")
  await supabase.from("ticket_types").delete().eq("id", id).eq("sold", 0)
  await revalidateEvent(supabase, event_id)
}

export async function updateProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase, userId } = await requireHost()
  const fields = {
    display_name: str(fd, "display_name"),
    bio: str(fd, "bio"),
    contact_whatsapp: str(fd, "contact_whatsapp"),
    contact_email: str(fd, "contact_email").toLowerCase(),
    website: str(fd, "website"),
    instagram: str(fd, "instagram").replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/$/, ""),
    phone: str(fd, "phone"),
  }
  const fail = (message: string) => ({ status: "error" as const, message, fields })
  if (fields.display_name.length < 2 || fields.display_name.length > 80) return fail("Enter the name guests will see (2 to 80 characters).")
  if (fields.bio.length > 280) return fail("Keep the short description under 280 characters.")

  const toIntl = (v: string) => {
    const d = v.replace(/[\s()-]/g, "")
    if (/^0[789][01]\d{8}$/.test(d)) return "234" + d.slice(1)
    if (/^\+?234[789][01]\d{8}$/.test(d)) return d.replace(/^\+/, "")
    return null
  }
  const whatsapp = fields.contact_whatsapp ? toIntl(fields.contact_whatsapp) : null
  if (fields.contact_whatsapp && !whatsapp) return fail("Enter the WhatsApp number as a Nigerian number, like 0810 330 1999.")
  if (fields.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.contact_email)) return fail("Check the contact email.")
  let website = fields.website
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`
  if (website && !/^https?:\/\/[^\s/]+\.[^\s]{2,}/i.test(website)) return fail("Check the website address.")
  if (fields.instagram && !/^[A-Za-z0-9._]{1,30}$/.test(fields.instagram)) return fail("Check the Instagram username.")
  const phone = fields.phone ? toIntl(fields.phone) : null
  if (fields.phone && !phone) return fail("Enter your private number as a Nigerian number, like 0810 330 1999.")

  const { error: e1 } = await supabase.from("profiles").update({
    display_name: fields.display_name,
    bio: fields.bio,
    contact_whatsapp: whatsapp,
    contact_email: fields.contact_email || null,
    website: website || null,
    instagram: fields.instagram || null,
  }).eq("id", userId)
  const { error: e2 } = await supabase.from("host_contacts").upsert({ host_id: userId, phone })
  if (e1 || e2) return fail("We couldn't save your profile. Try again.")
  revalidatePath("/dashboard", "layout")
  revalidatePath("/e/[slug]", "page")
  return { status: "ok", message: "Profile saved." }
}

// Called from the switches in the host tools. Row Level Security limits both to the event's host.
export async function setTicketOnSale(ticketId: string, eventId: string, onSale: boolean): Promise<{ ok: boolean }> {
  const { supabase } = await requireHost()
  const { error } = await supabase.from("ticket_types").update({ on_sale: onSale }).eq("id", ticketId).eq("event_id", eventId)
  if (error) return { ok: false }
  await revalidateEvent(supabase, eventId)
  return { ok: true }
}

export async function saveFeeMode(eventId: string, mode: "buyer" | "absorb"): Promise<{ ok: boolean }> {
  if (mode !== "buyer" && mode !== "absorb") return { ok: false }
  const { supabase } = await requireHost()
  const { error } = await supabase.from("events").update({ fee_mode: mode }).eq("id", eventId)
  if (error) return { ok: false }
  await revalidateEvent(supabase, eventId)
  return { ok: true }
}
