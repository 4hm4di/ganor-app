import { cookies } from "next/headers"

// One-shot result message for the pop-up banner. Server actions set it; <Toaster /> shows it once and clears it.
export const FLASH_COOKIE = "ganor_flash"
export type FlashKind = "ok" | "error"

export async function flash(kind: FlashKind, message: string) {
  const jar = await cookies()
  jar.set(FLASH_COOKIE, encodeURIComponent(JSON.stringify({ k: kind, m: message.slice(0, 240), t: Date.now() })), {
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
