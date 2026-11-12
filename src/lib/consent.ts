// Wording shown to buyers. Bump the version whenever the text changes; orders store the version they agreed to.
export const CONSENT_VERSION = "2026-11-v1"

// Under the WhatsApp number at checkout (a notice, not a checkbox: delivering the ticket is part of the purchase).
export const CHECKOUT_NOTICE =
  "Ganor will send your ticket to this WhatsApp number, plus essential updates about this event (time or venue changes, cancellation)."

// Separate checkbox at checkout, unticked by default.
export const RATING_CONSENT_LABEL =
  "After the event, Ganor may send me one WhatsApp message asking me to rate the event and its organiser. I can reply STOP at any time to stop these."

// Beside the Pay button.
export const CHECKOUT_PRIVACY_LINE =
  "Your details are stored with service providers outside Nigeria (including Supabase, Vercel and Meta/WhatsApp) and kept for 6 months after the event. Organisers can't use your number for promotions. See our Privacy Notice for your rights, including the right to complain to the Nigeria Data Protection Commission."

// WhatsApp Utility template "ganor_rate_event" (submit to Meta). {{1}} first name, {{2}} event, {{3}} date, {{4}} order, {{5}} link expiry.
// Button: "Rate this event", URL https://app.ganor.ng/r/{{1}}
export const RATING_TEMPLATE =
  "Hi {{1}}, {{2}} on {{3}} has ended. As a ticket holder on order {{4}}, you can rate the event and its organiser. It takes under a minute, and the link works until {{5}}. Reply STOP to get no more rating requests from Ganor."

export function ratingMessage(v: { firstName: string; event: string; date: string; order: string; until: string; link: string }) {
  return (
    RATING_TEMPLATE.replace("{{1}}", v.firstName)
      .replace("{{2}}", v.event)
      .replace("{{3}}", v.date)
      .replace("{{4}}", v.order)
      .replace("{{5}}", v.until) + `\n\nRate this event: ${v.link}`
  )
}

// Shown on the rating page before Submit.
export const REVIEW_PUBLIC_NOTICE =
  "Your rating and comment will appear publicly on this event and the organiser's profile under the name you choose. Your phone number is never shown. The organiser can reply publicly. At small events the organiser may still guess who you are. You can edit until the link expires and ask us to delete your review at any time by emailing support@ganor.ng. Please describe your own experience only."

// Ratings show an average only once a host has this many counted (scanned, unrefunded) ratings.
export const MIN_COUNTED_RATINGS = 5
