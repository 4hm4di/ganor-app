import { notFound } from "next/navigation"
import { getHq, roleLabel } from "@/lib/hq"
import { Icon } from "@/components/Icon"

// Ganor HQ: everything under /hq is for Ganor staff only and linked from nowhere in the host app. The database checks again on every call.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { me } = await getHq()
  if (!me) notFound() // signed-out or not staff: plain 404, no redirect that would reveal this area
  return (
    <div className="wrap admin">
      <div className="admin__top">
        <span className="kicker"><Icon name="shield" size={18} />Ganor HQ · {me.display_name ?? "staff"} · <span className="badge badge--ok">{roleLabel(me.role)}</span></span>
      </div>
      {children}
    </div>
  )
}
