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
  // New host accounts: confirm the email, end the link's session and ask them to sign in.
  const verified = async () => {
    await supabase.auth.signOut({ scope: "local" })
    return NextResponse.redirect(`${origin}/auth/verified`)
  }

  const code = searchParams.get("code")
  if (code) {
    // A sign-up code only arrives after Supabase has confirmed the email, so even if the
    // link was opened on another device (no PKCE verifier here) the account is verified.
    if (searchParams.get("verified") === "1") return verified()
    const { data: ex, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Host sign-ins keep one active device: end the account's other sessions.
      if (!(ex.user?.app_metadata as { hq?: boolean } | undefined)?.hq) await supabase.auth.signOut({ scope: "others" })
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Email templates that send token_hash links (works across devices)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      if (type === "signup" || searchParams.get("verified") === "1") return verified()
      return NextResponse.redirect(`${origin}${type === "recovery" ? "/reset-password" : next}`)
    }
  }

  const reason = searchParams.get("error") ? "provider" : "link"
  return NextResponse.redirect(`${origin}/login?error=${reason}`)
}
