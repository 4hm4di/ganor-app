import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

// Browser client, used for direct image uploads and review reports. It writes auth cookies
// itself when it refreshes a token, so it uses the same session-only rule as the server.
export function createClient() {
  return createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return document.cookie
          .split("; ")
          .filter(Boolean)
          .map((c) => {
            const i = c.indexOf("=")
            return { name: decodeURIComponent(c.slice(0, i)), value: decodeURIComponent(c.slice(i + 1)) }
          })
      },
      setAll(cookies) {
        for (const { name, value, options } of cookies) {
          let c = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=${options?.path ?? "/"}; SameSite=${options?.sameSite ?? "Lax"}`
          if (options?.maxAge === 0) c += "; Max-Age=0"
          if (location.protocol === "https:") c += "; Secure"
          document.cookie = c
        }
      },
    },
  })
}
