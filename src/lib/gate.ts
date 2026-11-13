import "server-only"
import { cookies } from "next/headers"

// Gate staff sign in with a username + password that their host created. Their session token
// lives in an httpOnly cookie; the database stores only its hash and checks it on every scan.
export const GATE_COOKIE = "ganor_gate"

export async function gateToken() {
  return (await cookies()).get(GATE_COOKIE)?.value ?? null
}

export async function setGateToken(token: string, expires: string) {
  ;(await cookies()).set(GATE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  })
}

export async function clearGateToken() {
  ;(await cookies()).delete(GATE_COOKIE)
}

export type GateSession = {
  id: string
  username: string
  name: string
  host_name: string
  host_logo: string | null
  events: { id: string; title: string; starts_at: string; ends_at: string | null; venue: string; city: string; checked_in: number; total: number }[]
}

export type CheckInResult = {
  result: "ok" | "already" | "not_found" | "wrong_event" | "not_valid" | "not_allowed" | "signed_out"
  reason?: "replaced" | "ended"
  guest?: string
  ticket_type?: string
  at?: string
  by?: string
  checked_in?: number
  total?: number
}
