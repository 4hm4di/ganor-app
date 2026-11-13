"use server"

import { redirect } from "next/navigation"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { safeNext } from "@/lib/auth"

const TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"]

// The email link opens a page with a button; only pressing it uses the one-time token.
// Mail scanners (Gmail, Outlook, antivirus) open links to check them, which used to burn the token first.
export async function confirmEmailLink(fd: FormData) {
  const tokenHash = String(fd.get("token_hash") ?? "")
  const type = String(fd.get("type") ?? "") as EmailOtpType
  const next = safeNext(String(fd.get("next") ?? ""))
  if (!tokenHash || !TYPES.includes(type)) redirect("/login?error=link")
  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
  if (error) redirect(type === "email_change" ? "/login?error=email" : "/login?error=link")
  // A link sign-in (or password reset) on this device ends the host's other sessions: one active device.
  if (type !== "signup" && type !== "email_change" && !(data.user?.app_metadata as { hq?: boolean } | undefined)?.hq) {
    await supabase.auth.signOut({ scope: "others" })
  }
  if (type === "recovery") redirect("/reset-password")
  if (type === "signup") {
    // Confirmed. They sign in themselves, so the first visit to the dashboard is a deliberate one.
    await supabase.auth.signOut({ scope: "local" })
    redirect("/auth/verified")
  }
  if (type === "email_change") {
    // With "secure email change" on, both inboxes must confirm. Until then the new address waits.
    const waiting = Boolean(data.user?.new_email)
    redirect(`/dashboard/profile?email=${waiting ? "one-more" : "changed"}`)
  }
  redirect(next)
}
