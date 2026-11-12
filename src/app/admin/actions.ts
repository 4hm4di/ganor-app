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
  revalidatePath("/admin", "layout")
  return { status: "ok", message: suspend ? "Host suspended. Their events are hidden and gate accounts signed out." : "Host restored." }
}

export async function setEventStatus(fd: FormData) {
  const supabase = await db()
  if (!supabase) return
  await supabase.rpc("admin_set_event_status", { p_event: String(fd.get("event_id")), p_status: String(fd.get("status")), p_note: String(fd.get("note") ?? "") || undefined })
  revalidatePath("/admin", "layout")
}

export async function setStaffRole(_prev: AdminState, fd: FormData): Promise<AdminState> {
  const supabase = await db()
  if (!supabase) return { status: "error", message: "Sign in again." }
  const grant = fd.get("grant") === "1"
  const { error } = await supabase.rpc("admin_set_staff_role", { p_email: String(fd.get("email") ?? ""), p_grant: grant })
  if (error) return { status: "error", message: error.message }
  revalidatePath("/admin", "layout")
  return { status: "ok", message: grant ? "Added as Ganor staff." : "Removed from Ganor staff." }
}
