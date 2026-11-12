import { getUserId } from "@/lib/supabase/server"
import { PublicNav } from "./PublicNav"
import { AppNav } from "./AppNav"

export async function Header() {
  const { supabase, userId, email } = await getUserId()

  if (!userId) return <PublicNav />

  const [{ data: profile }, { data: staff }] = await Promise.all([
    supabase.from("profiles").select("display_name, logo_url").eq("id", userId).maybeSingle(),
    supabase.rpc("is_staff"),
  ])
  return <AppNav name={profile?.display_name || email || "Host"} email={email ?? ""} logo={profile?.logo_url ?? null} staff={staff === true} />
}
