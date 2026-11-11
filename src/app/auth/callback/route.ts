import { NextResponse, type NextRequest } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { safeNext } from "@/lib/auth"

// Every sign-in that leaves the site comes back here: email links, sign-up confirmation,
// password reset, and Google / Microsoft / Apple. The one-time code becomes a session cookie.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const next = safeNext(searchParams.get("next"))
  const supabase = await createClient()

  const code = searchParams.get("code")
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  // Email templates that send token_hash links (works across devices)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) return NextResponse.redirect(`${origin}${type === "recovery" ? "/reset-password" : next}`)
  }

  const reason = searchParams.get("error") ? "provider" : "link"
  return NextResponse.redirect(`${origin}/login?error=${reason}`)
}
