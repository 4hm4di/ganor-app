// Session rules shared by the proxy, server and browser Supabase clients.
//
// 1. Sign-in cookies last only for the browser session (no 400-day lifetime): closing the
//    browser signs you out.
// 2. After IDLE_MINUTES without activity the next request signs you out and sends you to
//    /login?expired=1. Activity is tracked by a short-lived httpOnly cookie that every
//    request (and the in-page keep-alive while you're working) refreshes.
export const IDLE_MINUTES = 30
export const ACTIVE_COOKIE = "ganor_active"

type Opts = { maxAge?: number; expires?: Date; [k: string]: unknown }

// Keep deletions (maxAge 0) but drop long lifetimes so auth cookies end with the browser session.
export function sessionOnly<T extends Opts | undefined>(options: T): T {
  if (!options) return options
  if (options.maxAge === 0) return options
  const { maxAge: _m, expires: _e, ...rest } = options
  void _m
  void _e
  return rest as T
}
