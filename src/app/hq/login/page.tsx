import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { HqLoginForm } from "./HqLoginForm"

export const metadata: Metadata = { title: { absolute: "Ganor" }, robots: { index: false, follow: false } }

// Staff entrance. Not linked from anywhere; bookmark it.
export default async function HqLogin() {
  const { supabase, userId } = await getUserId()
  if (userId && (await supabase.rpc("is_staff")).data === true) redirect("/hq")
  return (
    <div className="wrap--narrow" style={{ maxWidth: 440, paddingTop: "clamp(32px, 8vw, 72px)" }}>
      <div className="card stack">
        <h1 style={{ font: "800 28px/1.1 var(--ganor-font-display)" }}>Staff sign in</h1>
        <p className="small muted">For Ganor staff accounts only.</p>
        <HqLoginForm />
      </div>
    </div>
  )
}
