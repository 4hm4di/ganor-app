"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PASSWORD_MIN, PROVIDERS, safeNext, siteOrigin, type ProviderId } from "@/lib/auth"

export type AuthState = { status: "idle" | "sent" | "confirm" | "error"; message?: string; email?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const read = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim()

function friendly(message: string) {
  if (/invalid login credentials/i.test(message)) return "That email and password don't match. Try again, or reset your password."
  if (/email not confirmed/i.test(message)) return "Confirm your email first. We sent you a link when you created your account."
  if (/already registered|already been registered|user already exists/i.test(message)) return "There's already an account with that email. Sign in instead."
  if (/rate|seconds|too many/i.test(message)) return "Too many tries just now. Wait a minute and try again."
  if (/weak|pwned|leaked/i.test(message)) return "Choose a stronger password. That one has appeared in a data leak."
  return "Something went wrong. Try again in a moment."
}

export async function signInWithPassword(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const email = read(fd, "email").toLowerCase()
  const password = String(fd.get("password") ?? "")
  const next = safeNext(read(fd, "next"))
  if (!EMAIL_RE.test(email)) return { status: "error", message: "Enter a valid email address.", email }
  if (!password) return { status: "error", message: "Enter your password.", email }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { status: "error", message: friendly(error.message), email }
  redirect(next)
}

export async function signUpWithPassword(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const email = read(fd, "email").toLowerCase()
  const password = String(fd.get("password") ?? "")
  const name = read(fd, "name")
  const next = safeNext(read(fd, "next"))
  if (name.length < 2) return { status: "error", message: "Enter your name or your organisation's name.", email }
  if (!EMAIL_RE.test(email)) return { status: "error", message: "Enter a valid email address.", email }
  if (password.length < PASSWORD_MIN) return { status: "error", message: `Use at least ${PASSWORD_MIN} characters for your password.`, email }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return { status: "error", message: "Use letters and numbers in your password.", email }

  const supabase = await createClient()
  const origin = await siteOrigin()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
      // The link confirms the email, then shows "verified, sign in" instead of opening the dashboard.
      emailRedirectTo: `${origin}/auth/callback?verified=1&next=${encodeURIComponent(next)}`,
    },
  })
  if (error) return { status: "error", message: friendly(error.message), email }
  // With email confirmation on, there's no session until the link is opened.
  if (!data.session) return { status: "confirm", email }
  redirect(next)
}

export async function sendLoginLink(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const email = read(fd, "email").toLowerCase()
  const next = safeNext(read(fd, "next"))
  if (!EMAIL_RE.test(email)) return { status: "error", message: "Enter a valid email address.", email }

  const supabase = await createClient()
  const origin = await siteOrigin()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  })
  if (error) return { status: "error", message: friendly(error.message), email }
  return { status: "sent", email }
}

export async function signInWithProvider(fd: FormData) {
  const provider = read(fd, "provider") as ProviderId
  const next = safeNext(read(fd, "next"))
  if (!PROVIDERS.some((p) => p.id === provider)) redirect("/login")

  const supabase = await createClient()
  const origin = await siteOrigin()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      scopes: provider === "azure" ? "email" : undefined,
    },
  })
  if (error || !data.url) redirect(`/login?error=provider&next=${encodeURIComponent(next)}`)
  redirect(data.url)
}

export async function sendPasswordReset(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const email = read(fd, "email").toLowerCase()
  if (!EMAIL_RE.test(email)) return { status: "error", message: "Enter a valid email address.", email }
  const supabase = await createClient()
  const origin = await siteOrigin()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  })
  // Same answer whether or not the account exists, so the form can't be used to check emails.
  if (error && /rate|seconds|too many/i.test(error.message)) return { status: "error", message: friendly(error.message), email }
  return { status: "sent", email }
}

export async function setNewPassword(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const password = String(fd.get("password") ?? "")
  const confirm = String(fd.get("confirm") ?? "")
  if (password.length < PASSWORD_MIN) return { status: "error", message: `Use at least ${PASSWORD_MIN} characters.` }
  if (password !== confirm) return { status: "error", message: "The two passwords don't match." }
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims?.sub) return { status: "error", message: "Your reset link has expired. Request a new one." }
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { status: "error", message: friendly(error.message) }
  redirect("/dashboard?password=updated")
}
