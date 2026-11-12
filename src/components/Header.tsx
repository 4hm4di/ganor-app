import Link from "next/link"
import { getUserId } from "@/lib/supabase/server"
import { Icon } from "./Icon"
import { AppNav } from "./AppNav"

export async function Header() {
  const { supabase, userId, email } = await getUserId()

  if (!userId) {
    return (
      <header className="topbar">
        <div className="wrap topbar__in">
          <Link href="/" className="topbar__logo" aria-label="Ganor home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/ganor-lockup-indigo.svg" alt="Ganor" width={118} height={22} />
          </Link>
          <nav className="topbar__nav" aria-label="Main">
            <Link href="/events" className="topbar__link">Find events</Link>
            <Link href="/login" className="btn btn--primary btn--sm nav-cta">
              <span>Host sign in</span>
              <span className="btn__arrow" aria-hidden="true"><Icon name="arrow" /></span>
            </Link>
          </nav>
        </div>
      </header>
    )
  }

  const [{ data: profile }, { data: staff }] = await Promise.all([
    supabase.from("profiles").select("display_name, logo_url").eq("id", userId).maybeSingle(),
    supabase.rpc("is_staff"),
  ])
  return <AppNav name={profile?.display_name || email || "Host"} email={email ?? ""} logo={profile?.logo_url ?? null} staff={staff === true} />
}
