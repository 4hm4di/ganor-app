import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

// One client per request. Server Components can't set cookies, so writes there are skipped;
// the proxy refreshes the session on every request instead.
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
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
