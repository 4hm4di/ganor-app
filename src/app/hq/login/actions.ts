"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type HqLoginState = { error?: string; email?: string }

// Staff sign-in. Uses the normal Ganor account system, but only staff accounts get through;
// anyone else is signed straight back out with the same message as a wrong password.
export async function hqLogin(_prev: HqLoginState, fd: FormData): Promise<HqLoginState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase()
  const password = String(fd.get("password") ?? "")
  if (!email || !password) return { error: "Enter your email and password.", email }
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: "Those details don't work here.", email }
  const { data: staff } = await supabase.rpc("is_staff")
  if (!staff) {
    await supabase.auth.signOut()
    return { error: "Those details don't work here.", email }
  }
  redirect("/hq")
}
