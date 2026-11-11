import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { ResetForm } from "./ResetForm"

export const metadata: Metadata = { title: "Choose a new password" }

export default async function ResetPassword() {
  // The reset email signs the host in for this one step; without that session, start again.
  const { userId } = await getUserId()
  if (!userId) redirect("/forgot-password")
  return (
    <div className="wrap--narrow" style={{ maxWidth: 480 }}>
      <div className="pagehead">
        <div>
          <span className="kicker">For hosts</span>
          <h1 style={{ marginTop: 10 }}>Choose a new password</h1>
          <p className="muted">Use at least 8 characters.</p>
        </div>
      </div>
      <div className="card"><ResetForm /></div>
    </div>
  )
}
