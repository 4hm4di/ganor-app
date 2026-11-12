import { notFound } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { Icon } from "@/components/Icon"
import { AdminTabs } from "./AdminTabs"

// Ganor HQ: everything under /hq is for Ganor staff only and linked from nowhere in the host app. The database checks again on every call.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, userId } = await getUserId()
  if (!userId) notFound() // signed-out: plain 404, no redirect that would reveal this area
  const { data: staff } = await supabase.rpc("is_staff")
  if (!staff) notFound()
  return (
    <div className="wrap admin">
      <div className="admin__top">
        <span className="kicker"><Icon name="shield" size={18} />Ganor HQ · staff only</span>
        <AdminTabs />
      </div>
      {children}
    </div>
  )
}
