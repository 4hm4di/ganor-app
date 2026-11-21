// When a host's paid tickets can go on sale. The database enforces the same rule
// (private.paid_sales_open): no paid order can start unless the host's payout account is
// verified by Ganor and set up as a Paystack subaccount, so each sale splits straight to their bank.

export type PayoutGate = {
  status: string
  status_note?: string | null
  paystack_subaccount_code?: string | null
} | null

export type SalesState = {
  open: boolean
  tone: "ok" | "info" | "warn" | "error"
  icon: string
  title: string
  text: string
  cta?: { href: string; label: string }
}

const PAYOUTS = "/dashboard/profile#payouts"

export function paidSalesState(a: PayoutGate): SalesState {
  if (!a) {
    return {
      open: false, tone: "warn", icon: "wallet",
      title: "Add your payout account to sell paid tickets.",
      text: "Paid tickets go on sale once Ganor has verified the bank account your money goes to.",
      cta: { href: PAYOUTS, label: "Add account" },
    }
  }
  if (a.status === "rejected") {
    return {
      open: false, tone: "error", icon: "warning",
      title: "Paid tickets can't go on sale yet.",
      text: a.status_note ? `Your payout account needs a fix. Ganor says: ${a.status_note}` : "Your payout account didn't match your bank's record. Update it and we'll check again.",
      cta: { href: PAYOUTS, label: "Fix details" },
    }
  }
  if (a.status !== "verified") {
    return {
      open: false, tone: "info", icon: "clock",
      title: "Paid tickets aren't on sale yet.",
      text: "Ganor is checking your payout account. Paid tickets go on sale once it's verified.",
      cta: { href: PAYOUTS, label: "See account" },
    }
  }
  if (!a.paystack_subaccount_code) {
    return {
      open: false, tone: "info", icon: "verified",
      title: "Your payout account is verified.",
      text: "Paid tickets go on sale as soon as card, transfer and USSD payments open on Ganor.",
    }
  }
  return {
    open: true, tone: "ok", icon: "check-circle",
    title: "Paid tickets are on sale.",
    text: "Each sale is split at checkout: your share goes straight to your bank.",
  }
}
