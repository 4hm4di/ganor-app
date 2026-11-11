import Link from "next/link"
import { getUserId } from "@/lib/supabase/server"

export async function Header() {
  const { userId } = await getUserId()
  return (
    <header className="topbar">
      <div className="wrap topbar__in">
        <Link href={userId ? "/dashboard" : "/"} className="topbar__logo" aria-label="Ganor home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/ganor-lockup-indigo.svg" alt="Ganor" width={118} height={22} />
        </Link>
        <nav className="topbar__nav" aria-label="Main">
          {userId ? (
            <>
              <Link href="/dashboard">My events</Link>
              <Link href="/dashboard/profile">Profile</Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className="linkbtn">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <a href="https://ganor.ng">ganor.ng</a>
              <Link href="/login" className="btn btn--primary btn--xs">Host sign in</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
