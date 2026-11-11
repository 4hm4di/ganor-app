import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

// Browser client, used only for direct image uploads to Storage (owner-only folders, enforced by policy).
export function createClient() {
  return createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!)
}
