import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireHqPage } from "@/lib/hq"
import { PayoutsView, type PayoutRow, type PlanDue, type Search, type Tracked } from "./PayoutsView"
import type { GanorWalletData } from "../GanorWallet"

export const metadata: Metadata = { title: { absolute: "Ganor" }, robots: { index: false } }

export default async function Payouts({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const { me, supabase } = await requireHqPage("payouts")
  if (!me.can.finance) notFound()
  const q = (sp.q ?? "").trim().slice(0, 80)
  const track = sp.tab === "track" && q
  const owner = me.role === "owner"
  const [{ data }, { data: plans }, tracked, { data: wallet }] = await Promise.all([
    supabase.rpc("admin_payouts"),
    supabase.rpc("admin_rsvp_plans"),
    track ? supabase.rpc("admin_track_ticket", { p_q: q }) : Promise.resolve(null),
    owner ? supabase.rpc("admin_wallet") : Promise.resolve({ data: null }),
  ])
  const found = tracked && !tracked.error ? ((tracked.data as Tracked[] | null) ?? []) : null
  const trackError = tracked?.error ? tracked.error.message.replace(/^.*?: /, "") : ""
  return <PayoutsView sp={sp} all={(data ?? []) as PayoutRow[]} plans={(plans ?? []) as PlanDue[]} found={found} trackError={trackError} wallet={(wallet as GanorWalletData) ?? null} />
}
