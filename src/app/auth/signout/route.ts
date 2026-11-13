import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ACTIVE_COOKIE } from "@/lib/session"

// Sign out, then land on the sign-in page (with a short "You're signed out" note).
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const why = request.nextUrl.searchParams.get("why") === "idle" ? "expired=1" : "signed_out=1"
  // HQ staff go back to the HQ sign-in, which isn't linked anywhere else.
  const dest = request.nextUrl.searchParams.get("to") === "hq" ? "/hq/login" : `/login?${why}`
  const res = NextResponse.redirect(new URL(dest, request.url), { status: 303 })
  res.cookies.delete(ACTIVE_COOKIE)
  return res
}
