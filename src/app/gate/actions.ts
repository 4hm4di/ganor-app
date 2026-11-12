"use server"

import { redirect } from "next/navigation"
import { createClient, getUserId } from "@/lib/supabase/server"
import { clearGateToken, gateToken, setGateToken, type CheckInResult } from "@/lib/gate"

export type GateLoginState = { error?: string; username?: string }

export async function gateLogin(_prev: GateLoginState, fd: FormData): Promise<GateLoginState> {
  const username = String(fd.get("username") ?? "").trim()
  const password = String(fd.get("password") ?? "")
  if (!username || !password) return { error: "Enter your username and password.", username }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("staff_login", { p_username: username, p_password: password })
  const res = data as { ok: boolean; error?: string; token?: string; expires_at?: string } | null
  if (error || !res) return { error: "Couldn't sign in. Check your connection and try again.", username }
  if (!res.ok) {
    const msg =
      res.error === "locked" ? "Too many wrong tries. This account is locked for 15 minutes; your host can reset the password."
      : res.error === "inactive" ? "This gate account is switched off. Ask your host to switch it back on."
      : "Wrong username or password."
    return { error: msg, username }
  }
  await setGateToken(res.token!, res.expires_at!)
  redirect("/gate")
}

export async function gateLogout() {
  const token = await gateToken()
  if (token) {
    const supabase = await createClient()
    await supabase.rpc("staff_logout", { p_token: token })
  }
  await clearGateToken()
  redirect("/gate")
}

// Hosts (signed in) scan without a gate cookie; gate staff use their cookie.
export async function checkIn(eventId: string, code: string): Promise<CheckInResult> {
  const { supabase, userId } = await getUserId()
  const token = await gateToken()
  const { data, error } = await supabase.rpc("check_in_ticket", {
    p_event: eventId,
    p_code: code,
    ...(token && !userId ? { p_staff_token: token } : {}),
  })
  if (error || !data) return { result: "not_found" }
  return data as CheckInResult
}
