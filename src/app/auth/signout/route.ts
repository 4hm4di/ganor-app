import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ACTIVE_COOKIE } from "@/lib/session"

// Sign out, then land on the sign-in page (with a short "You're signed out" note).
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const why = request.nextUrl.searchParams.get("why") === "idle" ? "expired=1" : "signed_out=1"
  const res = NextResponse.redirect(new URL(`/login?${why}`, request.url), { status: 303 })
  res.cookies.delete(ACTIVE_COOKIE)
  return res
}
