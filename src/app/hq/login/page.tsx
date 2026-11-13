import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getHq } from "@/lib/hq"
import { HqLoginForm } from "./HqLoginForm"

export const metadata: Metadata = { title: { absolute: "Ganor" }, robots: { index: false, follow: false } }

// Staff entrance. Not linked from anywhere; bookmark it.
export default async function HqLogin() {
  const { me } = await getHq()
  if (me) redirect("/hq")
  return (
    <div className="wrap--narrow" style={{ maxWidth: 440, paddingTop: "clamp(32px, 8vw, 72px)" }}>
      <div className="card stack">
        <h1 style={{ font: "800 28px/1.1 var(--ganor-font-display)" }}>Staff sign in</h1>
        <p className="small muted">For Ganor HQ team members. Use the username your HQ owner gave you, or your email if your own account has HQ access.</p>
        <HqLoginForm />
      </div>
    </div>
  )
}
