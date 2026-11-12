import { notFound } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { Icon } from "@/components/Icon"
import { AdminTabs } from "./AdminTabs"

// Everything under /admin is for Ganor staff only. The database checks again on every call.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, userId } = await getUserId()
  if (!userId) notFound()
  const { data: staff } = await supabase.rpc("is_staff")
  if (!staff) notFound()
  return (
    <div className="wrap admin">
      <div className="admin__top">
        <span className="kicker"><Icon name="shield" size={18} />Ganor admin</span>
        <AdminTabs />
      </div>
      {children}
    </div>
  )
}
