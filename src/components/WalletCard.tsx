import Link from "next/link"
import { Icon } from "./Icon"
import { GanorSymbol } from "./Loader"
import { maskAccount } from "@/lib/banks"

export type WalletAccount = { bank_name: string; account_number: string; account_name: string; status: string; status_note?: string | null } | null

const STATUS: Record<string, { label: string; tone: string; icon: string }> = {
  verified: { label: "Verified", tone: "ok", icon: "verified" },
  pending: { label: "Being checked", tone: "warn", icon: "clock" },
  rejected: { label: "Needs a fix", tone: "bad", icon: "warning" },
  missing: { label: "No payout account", tone: "warn", icon: "wallet" },
}
const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })

// The host's wallet as a card: take-home on the front, the payout account along the bottom.
export function WalletCard({ takeHome, month, account, manageHref }: { takeHome: number; month?: number; account: WalletAccount; manageHref?: string }) {
  const st = STATUS[account?.status ?? "missing"] ?? STATUS.pending
  return (
    <article className="wcard" aria-label="Your Ganor wallet">
      <span className="wcard__mark" aria-hidden="true"><GanorSymbol size={220} /></span>
      <header className="wcard__top">
        <span className="wcard__brand"><GanorSymbol size={22} />Ganor wallet</span>
        <span className={`wcard__st wcard__st--${st.tone}`}><Icon name={st.icon} size={14} />{st.label}</span>
      </header>
      <div className="wcard__bal">
        <span className="wcard__l">Your take-home</span>
        <b className="wcard__v">{money.format(Math.round(takeHome / 100))}</b>
        {month !== undefined && <span className="wcard__m">{money.format(Math.round(month / 100))} this month</span>}
      </div>
      <footer className="wcard__acct">
        {account ? (
          <>
            <span className="wcard__num">{maskAccount(account.account_number)}</span>
            <span className="wcard__who"><b>{account.account_name}</b><small>{account.bank_name}</small></span>
          </>
        ) : (
          <span className="wcard__who"><b>Add where your money goes</b><small>Bank account for paid ticket payouts</small></span>
        )}
        {manageHref && <Link href={manageHref} className="wcard__btn">{account ? "Change" : "Add account"}<Icon name="arrow-right" size={14} /></Link>}
      </footer>
    </article>
  )
}
