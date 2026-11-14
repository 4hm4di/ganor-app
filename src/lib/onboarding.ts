import "server-only"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

type Db = SupabaseClient<Database>

// A host who hasn't added a contact number and has no events yet is new: their first
// stop is the profile page, so they can finish setting up before creating an event.
export async function landingFor(supabase: Db, userId: string, next: string) {
  if (next !== "/dashboard") return next
  const [{ data: p }, { count }] = await Promise.all([
    supabase.from("profiles").select("contact_whatsapp, contact_phone").eq("id", userId).maybeSingle(),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("host_id", userId),
  ])
  const isNew = !p?.contact_whatsapp && !p?.contact_phone && (count ?? 0) === 0
  return isNew ? "/dashboard/profile?welcome=1" : next
}

// True when this Google sign-in has just created the account (first sign-in moments after creation).
export function justCreatedByGoogle(user: User) {
  const ids = user.identities ?? []
  if (ids.length === 0 || ids.some((i) => i.provider !== "google")) return false
  const created = new Date(user.created_at).getTime()
  const lastIn = new Date(user.last_sign_in_at ?? user.created_at).getTime()
  return Date.now() - created < 10 * 60_000 && Math.abs(lastIn - created) < 20_000
}

// Copy the Google profile photo into the host's logo, if they don't have one yet.
// Only Google's photo host is fetched, and only small images.
export async function importGooglePhoto(supabase: Db, user: User) {
  try {
    const raw = String(user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? "")
    const src = new URL(raw)
    if (src.protocol !== "https:" || !src.hostname.endsWith(".googleusercontent.com")) return
    const url = raw.replace(/=s\d+(-c)?$/, "=s400-c")
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: "error" })
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim()
    const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as Record<string, string>)[type]
    if (!res.ok || !ext) return
    const body = await res.arrayBuffer()
    if (body.byteLength === 0 || body.byteLength > 2_000_000) return
    const { data: p } = await supabase.from("profiles").select("logo_url").eq("id", user.id).maybeSingle()
    if (p?.logo_url) return
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from("host-logos").upload(path, body, { contentType: type, cacheControl: "31536000" })
    if (error) return
    const publicUrl = supabase.storage.from("host-logos").getPublicUrl(path).data.publicUrl
    await supabase.from("profiles").update({ logo_url: publicUrl }).eq("id", user.id).is("logo_url", null)
  } catch {
    // A missing photo never blocks sign-up.
  }
}
