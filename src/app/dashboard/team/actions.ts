"use server"

import { revalidatePath } from "next/cache"
import { getUserId } from "@/lib/supabase/server"

export type TeamState = { status: "idle" | "ok" | "error"; message?: string; created?: { name: string; username: string; password: string } }

const events = (fd: FormData) => fd.getAll("event_ids").map(String).filter(Boolean)

export async function createStaff(_prev: TeamState, fd: FormData): Promise<TeamState> {
  const { supabase, userId } = await getUserId()
  if (!userId) return { status: "error", message: "Sign in again." }
  const name = String(fd.get("display_name") ?? "").trim()
  const username = String(fd.get("username") ?? "").trim().toLowerCase()
  const password = String(fd.get("password") ?? "")
  const { error } = await supabase.rpc("host_create_staff", { p_username: username, p_display_name: name, p_password: password, p_event_ids: events(fd) })
  if (error) return { status: "error", message: error.message }
  revalidatePath("/dashboard/team")
  return { status: "ok", created: { name, username, password } }
}

export async function updateStaff(_prev: TeamState, fd: FormData): Promise<TeamState> {
  const { supabase, userId } = await getUserId()
  if (!userId) return { status: "error", message: "Sign in again." }
  const { error } = await supabase.rpc("host_update_staff", {
    p_staff: String(fd.get("id")),
    p_display_name: String(fd.get("display_name") ?? ""),
    p_active: fd.get("active") === "on",
    p_event_ids: events(fd),
  })
  if (error) return { status: "error", message: error.message }
  revalidatePath("/dashboard/team")
  return { status: "ok", message: "Saved." }
}

export async function resetStaffPassword(_prev: TeamState, fd: FormData): Promise<TeamState> {
  const { supabase, userId } = await getUserId()
  if (!userId) return { status: "error", message: "Sign in again." }
  const password = String(fd.get("password") ?? "")
  const { error } = await supabase.rpc("host_set_staff_password", { p_staff: String(fd.get("id")), p_password: password })
  if (error) return { status: "error", message: error.message }
  return { status: "ok", message: "New password set. They've been signed out on every phone.", created: { name: String(fd.get("display_name") ?? ""), username: String(fd.get("username") ?? ""), password } }
}

export async function deleteStaff(fd: FormData) {
  const { supabase, userId } = await getUserId()
  if (!userId) return
  await supabase.rpc("host_delete_staff", { p_staff: String(fd.get("id")) })
  revalidatePath("/dashboard/team")
}
