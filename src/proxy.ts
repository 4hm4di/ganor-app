import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { ACTIVE_COOKIE, IDLE_MINUTES, sessionOnly } from "@/lib/session"
import { isAiBot } from "@/lib/bots"

// Refreshes the Supabase session cookie on each request and keeps signed-out visitors
// out of the dashboard. Real access control is in the database (Row Level Security).
export async function proxy(request: NextRequest) {
  // AI crawlers and bulk scrapers that identify themselves get nothing.
  if (isAiBot(request.headers.get("user-agent"))) return new NextResponse("Not available.", { status: 403, headers: { "X-Robots-Tag": "noai, noimageai" } })
  if (request.nextUrl.pathname === "/") return NextResponse.next()

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

  if (signedIn) {
    // Idle timeout. A just-completed sign-in (within 5 minutes) counts as activity.
    const amr = (data?.claims?.amr as { timestamp?: number }[] | undefined) ?? []
    const signedInAt = Math.max(0, ...amr.map((a) => a.timestamp ?? 0)) * 1000
    const fresh = Date.now() - signedInAt < 5 * 60_000
    if (!request.cookies.get(ACTIVE_COOKIE) && !fresh) {
      await supabase.auth.signOut({ scope: "local" })
      signedIn = false
      if (path.startsWith("/dashboard")) {
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

  // HQ-only logins (created in HQ, no host account) belong in HQ, not the host dashboard.
  if (signedIn && path.startsWith("/dashboard") && (data?.claims?.app_metadata as { hq?: boolean } | undefined)?.hq) {
    const url = request.nextUrl.clone()
    url.pathname = "/hq"
    url.search = ""
    return NextResponse.redirect(url)
  }

  // /hq never redirects to sign-in, so its address isn't revealed: signed-out visitors get a 404 page.
  if (!signedIn && path.startsWith("/dashboard")) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = `?next=${encodeURIComponent(path)}`
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // Skip static files (anything with an extension, plus the landing page assets). The homepage only gets the bot check.
  matcher: ["/", "/((?!_next/static|_next/image|assets/|brand/|icons/|img/|social/|$|.*\\.[a-z0-9]+$).+)"],
}
