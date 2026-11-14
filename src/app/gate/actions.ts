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

// The scanner page decides who is scanning (host or gate account) and says so here, so a host
// session and a gate session in the same browser never get mixed up.
export async function checkIn(eventId: string, code: string, mode: "host" | "gate"): Promise<CheckInResult> {
  const { supabase, userId } = await getUserId()
  const token = mode === "gate" ? await gateToken() : null
  if (mode === "gate" ? !token : !userId) return { result: "signed_out" }
  const { data, error } = await supabase.rpc("check_in_ticket", {
    p_event: eventId,
    p_code: code,
    ...(token ? { p_staff_token: token } : {}),
  })
  if (error || !data) return { result: "not_found" }
  const res = data as CheckInResult
  // Say why: this gate account signed in on another device (one active device per account).
  if (res.result === "signed_out" && token) {
    const { data: why } = await supabase.rpc("staff_token_status", { p_token: token })
    if (why === "replaced") res.reason = "replaced"
  }
  return res
}
