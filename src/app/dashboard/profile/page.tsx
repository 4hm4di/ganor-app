import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { ProfileForm } from "./ProfileForm"

export const metadata: Metadata = { title: "Profile" }

export default async function Profile() {
  const { supabase, userId, email } = await getUserId()
  if (!userId) redirect("/login")
  const [{ data: profile }, { data: contact }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).single(),
    supabase.from("host_contacts").select("phone").eq("host_id", userId).maybeSingle(),
  ])

  return (
    <div className="wrap--narrow" style={{ maxWidth: 560 }}>
      <div className="pagehead">
        <div>
          <span className="kicker">Host profile</span>
          <h1 style={{ marginTop: 10 }}>Profile</h1>
          <p className="muted">Signed in as {email}.</p>
        </div>
      </div>
      <div className="card">
        <ProfileForm displayName={profile?.display_name ?? ""} phone={contact?.phone ?? ""} />
      </div>
    </div>
  )
}
