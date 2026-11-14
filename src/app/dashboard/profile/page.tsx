import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getUserId } from "@/lib/supabase/server"
import { ProfileForm } from "./ProfileForm"
import { Icon } from "@/components/Icon"
import { EmailForm } from "./EmailForm"
import { PayoutForm, type Payout } from "./PayoutForm"
import { ImageUpload } from "@/components/ImageUpload"
import { saveHostLogo } from "../actions"

export const metadata: Metadata = { title: "Profile" }

const local = (n: string | null) => (!n ? "" : /^234\d{10}$/.test(n) ? `0${n.slice(3)}` : n)

export default async function Profile({ searchParams }: { searchParams: Promise<{ email?: string; welcome?: string }> }) {
  const sp = await searchParams
  const { supabase, userId, email } = await getUserId()
  if (!userId) redirect("/login")
  const [{ data: p }, { data: contact }, { data: payout }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("host_contacts").select("phone").eq("host_id", userId).maybeSingle(),
    supabase.from("payout_accounts").select("account_type, business_name, bank_code, bank_name, account_number, account_name, settlement_email, settlement_phone, status, status_note").eq("host_id", userId).maybeSingle(),
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
      {sp.welcome && (
        <div className="alert alert--ok welcome" role="status" style={{ marginBottom: 14 }}>
          <Icon name="check-circle" />
          <span>
            <b>Welcome to Ganor{p?.display_name ? `, ${p.display_name}` : ""}.</b> Finish your host profile first: add your <b>WhatsApp or call number</b> so guests can reach you (you need it to publish). {p?.logo_url ? "Your photo and name came from your Google account; change them any time." : "Add your logo so guests recognise you."}
          </span>
          <Link href="/dashboard" className="alert__link">Skip for now</Link>
        </div>
      )}
      {sp.email === "changed" && <div className="alert alert--ok" role="status" style={{ marginBottom: 14 }}><Icon name="check-circle" /><span>Done. You now sign in with {email}.</span></div>}
      {sp.email === "one-more" && <div className="alert alert--ok" role="status" style={{ marginBottom: 14 }}><Icon name="mail" /><span>One address confirmed. Open the Ganor email in your other inbox and press its button to finish.</span></div>}
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
              contact_phone: local(p?.contact_phone ?? null),
              contact_email: p?.contact_email ?? "",
              website: p?.website ?? "",
              instagram: p?.instagram ?? "",
              phone: local(contact?.phone ?? null),
            }}
          />
        </div>
        <div className="card" id="payouts">
          <PayoutForm current={(payout as Payout) ?? null} defaultName={p?.display_name ?? ""} defaultEmail={email ?? ""} />
        </div>
        <div className="card">
          <EmailForm current={email ?? ""} />
        </div>
      </div>
    </div>
  )
}
