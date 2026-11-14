import "server-only"
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { cookies, headers } from "next/headers"

// RSVP protection. The database only accepts RSVPs carrying GANOR_RSVP_KEY, so every RSVP passes
// through here: a signed form timer (bots submit instantly), and hashed device and network keys the
// database counts per event. Raw IPs and device ids never leave this server.

const DEVICE_COOKIE = "ganor_did"
const MIN_FILL_MS = 3_000
const MAX_FORM_AGE_MS = 12 * 3_600_000

export const rsvpKey = () => process.env.GANOR_RSVP_KEY ?? ""
const mac = (s: string) => createHmac("sha256", rsvpKey()).update(s).digest("hex")

export function formStamp(eventId: string, now = Date.now()) {
  return `${now}.${mac(`form:${eventId}:${now}`).slice(0, 32)}`
}

export type StampCheck = "ok" | "fast" | "stale" | "bad"
export function checkStamp(eventId: string, stamp: string, now = Date.now()): StampCheck {
  const [ts, sig] = stamp.split(".")
  const t = Number(ts)
  if (!t || !sig || sig.length !== 32) return "bad"
  const want = Buffer.from(mac(`form:${eventId}:${t}`).slice(0, 32))
  if (!timingSafeEqual(want, Buffer.from(sig.padEnd(32).slice(0, 32)))) return "bad"
  if (now - t < MIN_FILL_MS) return "fast"
  if (now - t > MAX_FORM_AGE_MS) return "stale"
  return "ok"
}

export async function deviceKey() {
  const jar = await cookies()
  let id = jar.get(DEVICE_COOKIE)?.value
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    id = randomUUID()
    jar.set(DEVICE_COOKIE, id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 400 * 86_400 })
  }
  return mac(`device:${id}`).slice(0, 40)
}

export async function netKey() {
  const h = await headers()
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("x-real-ip") || ""
  return ip ? mac(`net:${ip}`).slice(0, 40) : ""
}

export async function siteOrigin() {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "app.ganor.ng"
  return `${host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https"}://${host}`
}
