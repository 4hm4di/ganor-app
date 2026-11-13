"use server"

import { revalidatePath } from "next/cache"
import { getUserId } from "@/lib/supabase/server"

export type AdminState = { status: "idle" | "ok" | "error"; message?: string }

async function db() {
  const { supabase, userId } = await getUserId()
  return userId ? supabase : null
}

export async function setSuspension(_prev: AdminState, fd: FormData): Promise<AdminState> {
  const supabase = await db()
  if (!supabase) return { status: "error", message: "Sign in again." }
  const suspend = fd.get("suspend") === "1"
  const { error } = await supabase.rpc("admin_set_suspension", { p_host: String(fd.get("host_id")), p_suspend: suspend, p_reason: String(fd.get("reason") ?? "") })
  if (error) return { status: "error", message: error.message }
  revalidatePath("/hq", "layout")
  return { status: "ok", message: suspend ? "Host suspended. Their events are hidden and gate accounts signed out." : "Host restored." }
}

export async function setEventStatus(fd: FormData) {
  const supabase = await db()
  if (!supabase) return
  await supabase.rpc("admin_set_event_status", { p_event: String(fd.get("event_id")), p_status: String(fd.get("status")), p_note: String(fd.get("note") ?? "") || undefined })
  revalidatePath("/hq", "layout")
}

export async function setStaffRole(_prev: AdminState, fd: FormData): Promise<AdminState> {
  const supabase = await db()
  if (!supabase) return { status: "error", message: "Sign in again." }
  const grant = fd.get("grant") === "1"
  const { error } = await supabase.rpc("admin_set_staff_role", { p_email: String(fd.get("email") ?? ""), p_grant: grant, p_role: String(fd.get("role") ?? "viewer") })
  if (error) return { status: "error", message: error.message }
  revalidatePath("/hq", "layout")
  return { status: "ok", message: grant ? "Added to the HQ team. They sign in at this address with their own email and password." : "Removed from the HQ team." }
}

// ─── HQ team (owner only; the database refuses everyone else) ───
export async function createMember(_prev: AdminState, fd: FormData): Promise<AdminState> {
  const supabase = await db()
  if (!supabase) return { status: "error", message: "Sign in again." }
  const username = String(fd.get("username") ?? "").trim().toLowerCase()
  const password = String(fd.get("password") ?? "")
  if (password !== String(fd.get("confirm") ?? "")) return { status: "error", message: "The two passwords don't match." }
  const { error } = await supabase.rpc("hq_create_member", { p_username: username, p_display_name: String(fd.get("display_name") ?? ""), p_role: String(fd.get("role") ?? ""), p_password: password })
  if (error) return { status: "error", message: error.message }
  revalidatePath("/hq/staff")
  return { status: "ok", message: `Login created. They sign in with the username "${username}" and the password you set. Share the password in person or over a call, not in a group chat.` }
}

export async function updateMember(_prev: AdminState, fd: FormData): Promise<AdminState> {
  const supabase = await db()
  if (!supabase) return { status: "error", message: "Sign in again." }
  const { error } = await supabase.rpc("hq_update_member", { p_user: String(fd.get("user_id")), p_role: String(fd.get("role")), p_active: fd.get("active") === "1" })
  if (error) return { status: "error", message: error.message }
  revalidatePath("/hq/staff")
  return { status: "ok", message: "Saved." }
}

export async function resetMemberPassword(_prev: AdminState, fd: FormData): Promise<AdminState> {
  const supabase = await db()
  if (!supabase) return { status: "error", message: "Sign in again." }
  const { error } = await supabase.rpc("hq_set_member_password", { p_user: String(fd.get("user_id")), p_password: String(fd.get("password") ?? "") })
  if (error) return { status: "error", message: error.message }
  return { status: "ok", message: "Password changed. They've been signed out everywhere." }
}

export async function removeMember(fd: FormData) {
  const supabase = await db()
  if (!supabase) return
  await supabase.rpc("hq_remove_member", { p_user: String(fd.get("user_id")) })
  revalidatePath("/hq/staff")
}

export async function setPayoutStatus(fd: FormData) {
  const supabase = await db()
  if (!supabase) return
  await supabase.rpc("admin_set_payout_status", { p_host: String(fd.get("host_id")), p_status: String(fd.get("status")), p_note: String(fd.get("note") ?? "") || undefined })
  revalidatePath("/hq", "layout")
}
