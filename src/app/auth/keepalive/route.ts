// Pinged by the dashboard while you're working on one page, so the proxy keeps your
// activity cookie fresh. Returns 401 once the session has ended.
import { getUserId } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const { userId } = await getUserId()
  return new Response(null, { status: userId ? 204 : 401, headers: { "Cache-Control": "no-store" } })
}
