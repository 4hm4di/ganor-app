"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Icon } from "./Icon"
import { RSVP_PLANS, naira } from "@/lib/plans"

// "New event" opens this: pick paid tickets or a free RSVP; RSVP shows the plans first.
export function NewEventChooser({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<"kind" | "plans">("kind")
  const router = useRouter()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => panel.current?.querySelector<HTMLElement>("button, a")?.focus(), 30)
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    document.documentElement.classList.add("is-locked")
    return () => { clearTimeout(t); document.removeEventListener("keydown", onKey); document.documentElement.classList.remove("is-locked") }
  }, [open, onClose])

  if (!open) return null
  const close = () => { setStep("kind"); onClose() }

  return createPortal(
    <div className="chooser" role="dialog" aria-modal="true" aria-labelledby="chooser-t" onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="chooser__panel" ref={panel}>
        <div className="chooser__head">
          {step === "plans" && <button type="button" className="iconbtn" aria-label="Back" onClick={() => setStep("kind")}><span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><Icon name="arrow-right" size={20} /></span></button>}
          <div>
            <b id="chooser-t">{step === "kind" ? "What kind of event?" : "RSVP plans, per event"}</b>
            <small>{step === "kind" ? "You can add more ticket types later." : "Pick the size of your guest list. You can upgrade before you publish."}</small>
          </div>
          <button type="button" className="burger burger--x chooser__x" aria-label="Close" onClick={close}><i /><i /></button>
        </div>

        {step === "kind" ? (
          <div className="chooser__kinds">
            <button type="button" className="kind" onClick={() => setStep("plans")}>
              <span className="kind__ic kind__ic--green"><Icon name="users" size={26} /></span>
              <b>Free RSVP</b>
              <small>Guests register for free with name, phone and a few questions. You pay one plan per event, from ₦50,000.</small>
              <span className="kind__go">See plans <Icon name="arrow-right" size={16} /></span>
            </button>
            <Link href="/dashboard/events/new?kind=paid" className="kind" onClick={close}>
              <span className="kind__ic"><Icon name="ticket" size={26} /></span>
              <b>Paid tickets</b>
              <small>Sell tickets by card, transfer or USSD. Ganor takes 5% + ₦100 per paid ticket, nothing else.</small>
              <span className="kind__go">Create event <Icon name="arrow-right" size={16} /></span>
            </Link>
          </div>
        ) : (
          <div className="plans">
            {RSVP_PLANS.map((p) => (
              <div key={p.id} className={`plan${p.popular ? " plan--pick" : ""}`}>
                <div className="plan__top"><b>{p.name}</b>{p.popular && <span className="badge badge--ok">Popular</span>}</div>
                <p className="plan__price">{naira(p.price)}<small> per event</small></p>
                <ul>{p.perks.map((k) => <li key={k}><Icon name="check-circle" size={16} />{k}</li>)}</ul>
                <button type="button" className={`btn btn--sm ${p.popular ? "btn--primary" : "btn--ghost btn--plain"}`} onClick={() => { close(); router.push(`/dashboard/events/new?kind=rsvp&plan=${p.id}`) }}>
                  <span>Choose {p.name}</span>{p.popular && <span className="btn__arrow" aria-hidden="true"><Icon name="arrow" /></span>}
                </button>
              </div>
            ))}
            <p className="plans__note small muted">One payment per event. Set everything up first; you pay for the plan when you publish. Guests always RSVP for free.</p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
