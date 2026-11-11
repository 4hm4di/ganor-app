"use client"

import { useOptimistic, useTransition } from "react"
import { saveFeeMode } from "./actions"
import { Icon } from "@/components/Icon"

type Mode = "buyer" | "absorb"

// The "Who pays the Ganor fee" switch from the landing page pricing calculator.
export function FeeSeg({ eventId, mode }: { eventId: string; mode: Mode }) {
  const [who, setWho] = useOptimistic<Mode>(mode)
  const [, startTransition] = useTransition()
  const pick = (m: Mode) => {
    if (m === who) return
    startTransition(async () => {
      setWho(m)
      await saveFeeMode(eventId, m)
    })
  }
  return (
    <div className="fee">
      <div className="seg" role="radiogroup" aria-label="Who pays the Ganor fee" data-who={who === "absorb" ? "host" : "buyer"}>
        <button className={`seg__opt${who === "buyer" ? " is-on" : ""}`} type="button" role="radio" aria-checked={who === "buyer"} onClick={() => pick("buyer")}>
          <Icon name="ticket" />Buyer pays the fee
        </button>
        <button className={`seg__opt${who === "absorb" ? " is-on" : ""}`} type="button" role="radio" aria-checked={who === "absorb"} onClick={() => pick("absorb")}>
          <Icon name="wallet" />You absorb the fee
        </button>
        <i className="seg__pill" aria-hidden="true" />
      </div>
      <p className="fee__note">
        {who === "buyer"
          ? "Your full ticket price goes to your bank. Buyers pay the fee at checkout."
          : "Buyers pay your ticket price. The fee comes out of each paid ticket."}
      </p>
    </div>
  )
}
