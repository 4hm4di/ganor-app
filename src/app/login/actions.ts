"use server"

import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export type LoginState = { status: "idle" | "sent" | "error"; message?: string; email?: string }

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"
}

export async function sendLoginLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const next = safeNext(String(formData.get("next") ?? ""))
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { status: "error", message: "Enter a valid email address.", email }
  }

  const h = await headers()
  const origin = h.get("origin") ?? `https://${h.get("host")}`
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error) {
    const wait = /rate|seconds|too many/i.test(error.message)
    return {
      status: "error",
      email,
      message: wait ? "Too many sign-in emails just now. Wait a minute and try again." : "We couldn't send the sign-in email. Try again in a moment.",
    }
  }
  return { status: "sent", email }
}
