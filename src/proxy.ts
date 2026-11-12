import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { ACTIVE_COOKIE, IDLE_MINUTES, sessionOnly } from "@/lib/session"

// Refreshes the Supabase session cookie on each request and keeps signed-out visitors
// out of the dashboard. Real access control is in the database (Row Level Security).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, sessionOnly(options)))
          Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value))
        },
      },
    },
  )

  const { data } = await supabase.auth.getClaims()
  let signedIn = Boolean(data?.claims?.sub)
  const path = request.nextUrl.pathname
  const protectedPath = path.startsWith("/dashboard") || path.startsWith("/hq")

  if (signedIn) {
    // Idle timeout. A just-completed sign-in (within 5 minutes) counts as activity.
    const amr = (data?.claims?.amr as { timestamp?: number }[] | undefined) ?? []
    const signedInAt = Math.max(0, ...amr.map((a) => a.timestamp ?? 0)) * 1000
    const fresh = Date.now() - signedInAt < 5 * 60_000
    if (!request.cookies.get(ACTIVE_COOKIE) && !fresh) {
      await supabase.auth.signOut({ scope: "local" })
      signedIn = false
      if (protectedPath) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        url.search = `?expired=1&next=${encodeURIComponent(path)}`
        const redirect = NextResponse.redirect(url)
        response.cookies.getAll().forEach((c) => redirect.cookies.set(c))
        return redirect
      }
      return response
    }
    response.cookies.set(ACTIVE_COOKIE, "1", { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: IDLE_MINUTES * 60 })
  }

  if (!signedIn && protectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = `?next=${encodeURIComponent(path)}`
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // Skip static files (anything with an extension, plus the landing page assets) and the rewritten homepage.
  matcher: ["/((?!_next/static|_next/image|assets/|brand/|icons/|img/|social/|$|.*\\.[a-z0-9]+$).+)"],
}
