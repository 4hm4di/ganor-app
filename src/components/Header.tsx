import { getUserId } from "@/lib/supabase/server"
import { PublicNav } from "./PublicNav"
import { AppNav } from "./AppNav"
import { HQ_LOGIN_DOMAIN } from "@/lib/hq"

export async function Header() {
  const { supabase, userId, email } = await getUserId()

  if (!userId) return <PublicNav />

  const [{ data: profile }, { data: staff }] = await Promise.all([
    supabase.from("profiles").select("display_name, logo_url").eq("id", userId).maybeSingle(),
    supabase.rpc("is_staff"),
  ])
  const hqOnly = (email ?? "").endsWith(`@${HQ_LOGIN_DOMAIN}`)
  return <AppNav name={profile?.display_name || email || "Host"} email={hqOnly ? "" : email ?? ""} logo={profile?.logo_url ?? null} staff={staff === true} hqOnly={hqOnly} />
}
