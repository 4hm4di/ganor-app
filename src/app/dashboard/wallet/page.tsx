import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUserId } from "@/lib/supabase/server"
import { hostEarnings } from "@/lib/earnings"
import { WalletView } from "./WalletView"

export const metadata: Metadata = { title: "Wallet" }

// Host wallet: what paid tickets earned, what Ganor kept, refunds, and where payouts go.
export default async function Wallet() {
  const { supabase, userId } = await getUserId()
  if (!userId) redirect("/login")
  const [earnings, { data: account }, { data: plans }] = await Promise.all([
    hostEarnings(supabase, userId),
    supabase.from("payout_accounts").select("bank_name, account_number, account_name, status, status_note").eq("host_id", userId).maybeSingle(),
    supabase.from("events").select("id, title, rsvp_plan, plan_paid_at").eq("host_id", userId).eq("event_kind", "rsvp").neq("rsvp_plan", "free").order("starts_at", { ascending: false }),
  ])
  return <WalletView e={earnings} account={account} plans={plans ?? []} />
}
