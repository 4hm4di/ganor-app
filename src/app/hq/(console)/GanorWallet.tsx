import { WalletCard } from "@/components/WalletCard"
import { planById } from "@/lib/plans"

export type GanorWalletData = {
  fees_kobo: number; fees_month_kobo: number; paid_tickets: number; gross_kobo: number; refunded_fees_kobo: number
  plans: { plan: string; paid_at: string }[]; month_start: string
} | null

// Ganor's own earnings, for the HQ owner: ticket fees kept (6% + ₦100 per paid ticket) plus paid RSVP plans.
export function GanorWallet({ w }: { w: GanorWalletData }) {
  if (!w) return null
  const planKobo = (p: { plan: string }) => planById(p.plan).price * 100
  const plans = w.plans.reduce((n, p) => n + planKobo(p), 0)
  const plansMonth = w.plans.filter((p) => new Date(p.paid_at) >= new Date(w.month_start)).reduce((n, p) => n + planKobo(p), 0)
  return (
    <WalletCard
      brand="Ganor HQ"
      label="Ganor earnings"
      takeHome={w.fees_kobo + plans}
      month={w.fees_month_kobo + plansMonth}
      status={{ label: "Owner only", tone: "ok", icon: "shield" }}
      split={[{ label: "Ticket fees", kobo: w.fees_kobo }, { label: "RSVP plans", kobo: plans }]}
      manageHref="https://dashboard.paystack.com/#/settlements"
      manageLabel="Paystack"
      external
    />
  )
}
