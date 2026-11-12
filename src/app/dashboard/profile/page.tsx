import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { ProfileForm } from "./ProfileForm"
import { EmailForm } from "./EmailForm"
import { ImageUpload } from "@/components/ImageUpload"
import { saveHostLogo } from "../actions"

export const metadata: Metadata = { title: "Profile" }

const local = (n: string | null) => (!n ? "" : /^234\d{10}$/.test(n) ? `0${n.slice(3)}` : n)

export default async function Profile() {
  const { supabase, userId, email } = await getUserId()
  if (!userId) redirect("/login")
  const [{ data: p }, { data: contact }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("host_contacts").select("phone").eq("host_id", userId).maybeSingle(),
  ])

  return (
    <div className="wrap--narrow">
      <div className="pagehead">
        <div>
          <span className="kicker">Host profile</span>
          <h1 style={{ marginTop: 10 }}>Profile</h1>
          <p className="muted">Signed in as {email}.</p>
        </div>
      </div>
      <div className="stack">
        <div className="card">
          <ImageUpload
            bucket="host-logos"
            userId={userId}
            current={p?.logo_url ?? null}
            save={saveHostLogo}
            shape="logo"
            label="Logo"
            hint="Square works best, at least 400 × 400 px. JPG, PNG or WebP."
          />
        </div>
        <div className="card">
          <ProfileForm
            initial={{
              display_name: p?.display_name ?? "",
              bio: p?.bio ?? "",
              contact_whatsapp: local(p?.contact_whatsapp ?? null),
              contact_email: p?.contact_email ?? "",
              website: p?.website ?? "",
              instagram: p?.instagram ?? "",
              phone: local(contact?.phone ?? null),
            }}
          />
        </div>
        <div className="card">
          <EmailForm current={email ?? ""} />
        </div>
      </div>
    </div>
  )
}
