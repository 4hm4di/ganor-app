// RSVP events are paid per event: one plan per event, benefits grow with the price.
// Paid-ticket events don't use these; they pay the per-ticket fee instead.
export type PlanId = "free" | "basic" | "standard" | "pro" | "premium"
export type RsvpPlan = { id: PlanId; name: string; price: number; cap: number; questions: number; perks: string[]; popular?: boolean }

export const RSVP_PLANS: RsvpPlan[] = [
  { id: "free", name: "Free", price: 0, cap: 30, questions: 2,
    perks: ["Up to 30 guests", "Name, phone and 2 questions", "QR code for every guest", "No payment, no bank details"] },
  { id: "basic", name: "Basic", price: 50_000, cap: 200, questions: 4,
    perks: ["Up to 200 guests", "Name, phone and 4 questions", "QR code for every guest", "Guest list download (CSV)"] },
  { id: "standard", name: "Standard", price: 100_000, cap: 500, questions: 6, popular: true,
    perks: ["Up to 500 guests", "6 questions", "Branded guest list PDF", "Gate team with scanner logins", "Everything in Basic"] },
  { id: "pro", name: "Pro", price: 175_000, cap: 1_500, questions: 6,
    perks: ["Up to 1,500 guests", "Tickets and reminders on WhatsApp", "Check-in by the hour report", "Everything in Standard"] },
  { id: "premium", name: "Premium", price: 250_000, cap: 5_000, questions: 6,
    perks: ["Up to 5,000 guests", "Featured on Find events", "Priority support on event day", "Everything in Pro"] },
]
export const planById = (id: string | null | undefined) => RSVP_PLANS.find((p) => p.id === id) ?? RSVP_PLANS[0]
export const questionLimit = (plan: string) => planById(plan).questions
export const naira = (n: number) => (n === 0 ? "Free" : `₦${n.toLocaleString("en-NG")}`)
export const isPaidPlan = (id: string | null | undefined) => planById(id).price > 0
