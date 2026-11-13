import { cache } from "react"
import { getUserId } from "@/lib/supabase/server"

export * from "./hq-roles"
import type { HqMe } from "./hq-roles"

export const getHq = cache(async (): Promise<{ me: HqMe | null; supabase: Awaited<ReturnType<typeof getUserId>>["supabase"] }> => {
  const { supabase, userId } = await getUserId()
  if (!userId) return { me: null, supabase }
  const { data, error } = await supabase.rpc("hq_me")
  if (error) {
    // Before the roles migration exists, fall back to the old yes/no staff check with full rights.
    const { data: staff } = await supabase.rpc("is_staff")
    if (staff !== true) return { me: null, supabase }
    return { me: { role: "owner", username: null, display_name: null, can: { moderate: true, audit: true, contacts: true, finance: true, team: true } }, supabase }
  }
  return { me: (data as HqMe | null) ?? null, supabase }
})
