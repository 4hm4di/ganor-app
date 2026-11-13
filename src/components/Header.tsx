import { getUserId } from "@/lib/supabase/server"
import { PublicNav } from "./PublicNav"
import { AppNav } from "./AppNav"
import { getHq, HQ_LOGIN_DOMAIN } from "@/lib/hq"

export async function Header() {
  const { supabase, userId, email } = await getUserId()

  if (!userId) return <PublicNav />

  const [{ data: profile }, { me }] = await Promise.all([
    supabase.from("profiles").select("display_name, logo_url").eq("id", userId).maybeSingle(),
    getHq(),
  ])
  const staff = !!me
  // HQ-only accounts (username logins, or an email set up just for HQ) have no host profile.
  const hqOnly = staff && (!profile || (email ?? "").endsWith(`@${HQ_LOGIN_DOMAIN}`))
  const name = hqOnly ? me?.display_name || "GANOR" : profile?.display_name || email || "Host"
  return <AppNav name={name} email={hqOnly && (email ?? "").endsWith(`@${HQ_LOGIN_DOMAIN}`) ? "" : email ?? ""} logo={hqOnly ? null : profile?.logo_url ?? null} staff={staff} hqOnly={hqOnly} hqCan={me ? { finance: me.can.finance, team: me.can.team } : undefined} />
}
