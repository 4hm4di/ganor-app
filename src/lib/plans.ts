// RSVP plans for free events. Paid-ticket events don't use these: they pay the per-ticket fee.
export type RsvpPlan = { id: "free" | "pass" | "org"; name: string; price: string; per: string; cap: number; perks: string[]; available: boolean }

export const RSVP_PLANS: RsvpPlan[] = [
  { id: "free", name: "Free", price: "₦0", per: "per event", cap: 100, available: true,
    perks: ["Up to 100 guests", "Name, phone and up to 4 questions", "QR code on screen for the gate", "Guest list download"] },
  { id: "pass", name: "Event Pass", price: "₦15,000", per: "per event", cap: 1000, available: false,
    perks: ["Up to 1,000 guests", "Up to 6 questions", "Tickets and reminders on WhatsApp", "Branded guest list PDF"] },
  { id: "org", name: "Organisation", price: "₦150,000", per: "per year", cap: 100000, available: false,
    perks: ["Unlimited free events and guests", "Everything in Event Pass", "Gate team for every event", "Priority support"] },
]
export const FREE_RSVP_CAP = 100
export const questionLimit = (plan: string) => (plan === "free" ? 4 : 6)
