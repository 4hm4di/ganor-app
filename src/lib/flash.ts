import { cookies } from "next/headers"

// One-shot result message for the pop-up banner. Server actions set it; <Toaster /> shows it once and clears it.
export const FLASH_COOKIE = "ganor_flash"
export type FlashKind = "ok" | "error"

type Flash = { k: FlashKind; m: string; t: number }

function parse(raw: string | undefined): Flash[] {
  let v = raw ?? ""
  for (let i = 0; i < 3 && v; i++) {
    try { const j = JSON.parse(v); return Array.isArray(j) ? j : [j] } catch { try { v = decodeURIComponent(v) } catch { return [] } }
  }
  return []
}

export async function flash(kind: FlashKind, message: string) {
  const jar = await cookies()
  // Queue (last 3) so two quick actions both get their banner.
  const queue = [...parse(jar.get(FLASH_COOKIE)?.value), { k: kind, m: message.slice(0, 240), t: Date.now() + Math.random() }].slice(-3)
  jar.set(FLASH_COOKIE, encodeURIComponent(JSON.stringify(queue)), {
    path: "/", maxAge: 30, sameSite: "lax", httpOnly: false, secure: process.env.NODE_ENV === "production",
  })
}

// Pass a form result through and show its message as a banner.
export async function report<T extends { status: string; message?: string }>(state: T, okText?: string): Promise<T> {
  if (state.status === "error") await flash("error", state.message || "That didn't work. Try again.")
  else if (state.status === "ok") await flash("ok", okText ?? state.message ?? "Done.")
  return state
}

// Friendly text for database errors raised by our own checks.
export const dbMessage = (e: { message?: string } | null | undefined, fallback = "That didn't work. Try again.") =>
  e?.message && !/violates|syntax|relation|column|permission denied|jwt/i.test(e.message) ? e.message : fallback
