import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ACTIVE_COOKIE } from "@/lib/session"
import { activeCookieFor } from "@/lib/supabase/area"

// Sign out, then land on the sign-in page (with a short "You're signed out" note).
export async function POST(request: NextRequest) {
  const hq = request.nextUrl.searchParams.get("to") === "hq"
  // Signs out of this area only (host or HQ); the other sign-in in this browser stays.
  const supabase = await createClient(hq ? "hq" : "host")
  await supabase.auth.signOut({ scope: "local" })
  const why = request.nextUrl.searchParams.get("why") === "idle" ? "expired=1" : "signed_out=1"
  // HQ staff go back to the HQ sign-in, which isn't linked anywhere else.
  const dest = hq ? `/hq/login${why === "expired=1" ? "?expired=1" : ""}` : `/login?${why}`
  const res = NextResponse.redirect(new URL(dest, request.url), { status: 303 })
  res.cookies.delete(activeCookieFor(ACTIVE_COOKIE, hq ? "hq" : "host"))
  return res
}
