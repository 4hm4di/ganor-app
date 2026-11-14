import { createServerClient } from "@supabase/ssr"
import { cookies, headers } from "next/headers"
import { AREA_HEADER, cookieOptionsFor, type Area } from "./area"
import type { Database } from "@/lib/database.types"
import { sessionOnly } from "@/lib/session"

// One client per request. Server Components can't set cookies, so writes there are skipped;
// the proxy refreshes the session on every request instead.
// The area (host or HQ) comes from the proxy, so HQ pages use the HQ sign-in and
// everything else uses the host sign-in.
export async function createClient(area?: Area) {
  const cookieStore = await cookies()
  const which: Area = area ?? ((await headers()).get(AREA_HEADER) === "hq" ? "hq" : "host")
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: cookieOptionsFor(which),
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, sessionOnly(options)))
          } catch {
            // Called from a Server Component: ignore, the proxy keeps the session fresh.
          }
        },
      },
    },
  )
}

// The signed-in user's id, verified against the project's signing keys, or null.
export async function getUserId() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return { supabase, userId: (data?.claims?.sub as string | undefined) ?? null, email: (data?.claims?.email as string | undefined) ?? null }
}
